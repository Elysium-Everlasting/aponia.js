import type { OIDCConfig, OIDCUserConfig } from '@auth/core/providers'
import type { TokenSet } from '@auth/core/types'
import * as oauth from 'oauth4webapi'

import {
  DEFAULT_CALLBACK_REDIRECT,
  DEFAULT_CALLBACK_ROUTE,
  DEFAULT_CHECKS,
  DEFAULT_LOGIN_ROUTE,
  DEFAULT_RESPONSE_TYPE,
  IS_BROWSER,
} from '../constants'
import * as checks from '../security/checks'
import { DEFAULT_COOKIES_OPTIONS, type Cookie, type CookiesOptions } from '../security/cookie'
import { DEFAULT_JWT_OPTIONS, type JWTOptions } from '../security/jwt'
import type { Endpoint, InternalRequest, InternalResponse, ProviderPages } from '../types'
import type { Awaitable, Nullish } from '../utils/types'

export type ResolvedOIDCConfig<TProfile> = {
  id: string
  issuer: string
  client: oauth.Client
  checks: OIDCConfig<any>['checks']
  pages: ProviderPages
  endpoints: {
    authorization: Endpoint<OIDCProvider<TProfile>>
    token: Endpoint<OIDCProvider<TProfile>, TokenSet>
    userinfo: Endpoint<{ provider: OIDCConfig<TProfile>; tokens: TokenSet }, TProfile>
  }
  onAuth?: (
    user: TProfile,
    tokens: oauth.OpenIDTokenEndpointResponse,
  ) => Awaitable<InternalResponse | Nullish> | Nullish
} & OIDCConfig<TProfile>

export class OIDCProvider<TProfile> {
  static type = 'oidc' as const

  type = OIDCProvider.type

  config: ResolvedOIDCConfig<TProfile>

  authorizationServer: oauth.AuthorizationServer

  cookiesOptions = DEFAULT_COOKIES_OPTIONS

  jwt = DEFAULT_JWT_OPTIONS

  constructor(options: ResolvedOIDCConfig<TProfile>) {
    this.config = options
    this.authorizationServer = { issuer: options.issuer }
  }

  get checkParams(): checks.CheckParams {
    return {
      checks: this.config.checks,
      cookies: this.cookiesOptions,
      jwt: this.jwt,
    }
  }

  setJwtOptions(options: JWTOptions) {
    this.jwt = options
    return this
  }

  setCookiesOptions(options: CookiesOptions) {
    this.cookiesOptions = options
    return this
  }

  async initialize() {
    const issuer = new URL(this.authorizationServer.issuer)

    const discoveryResponse = await oauth.discoveryRequest(issuer)

    const authorizationServer = await oauth.processDiscoveryResponse(issuer, discoveryResponse)

    const supportsPKCE = authorizationServer.code_challenge_methods_supported?.includes('S256')

    if (this.config.checks?.includes('pkce') && !supportsPKCE) {
      this.config.checks = ['nonce'] as any
    }

    this.authorizationServer = authorizationServer
  }

  async login(request: InternalRequest): Promise<InternalResponse> {
    await this.initialize()

    if (!this.authorizationServer.authorization_endpoint) {
      throw new TypeError(
        `Invalid authorization endpoint. ${this.authorizationServer.authorization_endpoint}`,
      )
    }

    const url = new URL(this.authorizationServer.authorization_endpoint)

    const cookies: Cookie[] = []

    Object.entries(this.config.endpoints?.authorization?.params ?? {}).forEach(([key, value]) => {
      if (typeof value === 'string') {
        url.searchParams.set(key, value)
      }
    })

    if (!url.searchParams.has('redirect_uri')) {
      url.searchParams.set(
        'redirect_uri',
        `${request.url.origin}${this.config.pages.callback.route}`,
      )
    }

    if (!url.searchParams.has('scope')) {
      url.searchParams.set('scope', 'openid profile email')
    }

    if (this.config.checks?.includes('state')) {
      const [state, stateCookie] = await checks.state.create(this.checkParams)
      url.searchParams.set('state', state)
      cookies.push(stateCookie)
    }

    if (this.config.checks?.includes('pkce')) {
      const [pkce, pkceCookie] = await checks.pkce.create(this.checkParams)
      url.searchParams.set('code_challenge', pkce)
      url.searchParams.set('code_challenge_method', 'S256')
      cookies.push(pkceCookie)
    }

    if (this.config.checks?.includes('nonce')) {
      const [nonce, nonceCookie] = await checks.nonce.create(this.checkParams)
      url.searchParams.set('nonce', nonce)
      cookies.push(nonceCookie)
    }

    return { status: 302, redirect: url.toString(), cookies }
  }

  async callback(request: InternalRequest): Promise<InternalResponse> {
    await this.initialize()

    const cookies: Cookie[] = []

    const [state, stateCookie] = await checks.state.use(request, this.checkParams)

    if (stateCookie) {
      cookies.push(stateCookie)
    }

    const codeGrantParams = await oauth.validateJwtAuthResponse(
      this.authorizationServer,
      this.config.client,
      request.url.searchParams,
      state,
    )

    if (oauth.isOAuth2Error(codeGrantParams)) {
      throw new Error(codeGrantParams.error_description)
    }

    const [pkce, pkceCookie] = await checks.pkce.use(request, this.checkParams)

    if (pkceCookie) {
      cookies.push(pkceCookie)
    }

    const initialCodeGrantResponse = await oauth.authorizationCodeGrantRequest(
      this.authorizationServer,
      this.config.client,
      codeGrantParams,
      `${request.url.origin}${this.config.pages.callback.route}`,
      pkce,
    )

    const codeGrantResponse =
      (await this.config.endpoints?.token?.conform?.(initialCodeGrantResponse.clone())) ??
      initialCodeGrantResponse

    const challenges = oauth.parseWwwAuthenticateChallenges(codeGrantResponse)

    if (challenges) {
      challenges.forEach((challenge) => {
        console.log('challenge', challenge)
      })
      throw new Error('TODO: Handle www-authenticate challenges as needed')
    }

    const [nonce, nonceCookie] = await checks.nonce.use(request, this.checkParams)

    if (nonceCookie) {
      cookies.push(nonceCookie)
    }

    const tokens = await oauth.processAuthorizationCodeOpenIDResponse(
      this.authorizationServer,
      this.config.client,
      codeGrantResponse,
      nonce,
    )

    if (oauth.isOAuth2Error(tokens)) {
      throw new Error('TODO: Handle OIDC response body error')
    }

    const profile: any = oauth.getValidatedIdTokenClaims(tokens)

    const processedResponse: InternalResponse = (await this.config.onAuth?.(profile, tokens)) ?? {
      session: {
        expires: '',
        user: (await this.config.profile?.(profile, tokens)) ?? profile,
      },
      redirect: this.config.pages.callback.redirect,
      status: 302,
    }

    processedResponse.cookies ??= []
    processedResponse.cookies.push(...cookies)

    return processedResponse
  }
}

export function resolveOIDCConfig<T = any>(
  config: OIDCConfig<T> & { options?: OIDCUserConfig<T> },
): ResolvedOIDCConfig<T> {
  const id = config.id ?? config.options?.id
  const clientId = config.clientId ?? config.options?.clientId ?? ''
  const clientSecret = config.clientSecret ?? config.options?.clientSecret
  const issuer = config.issuer ?? config.options?.issuer ?? ''
  const checks: any = config.checks ?? config.options?.checks ?? DEFAULT_CHECKS
  const token = config.token ?? config.options?.token ?? {}
  const userinfo = config.userinfo ?? config.options?.userinfo ?? {}

  return {
    ...config,
    ...config.options,
    id,
    issuer,
    client: {
      client_id: clientId,
      client_secret: clientSecret,
      ...config.client,
      ...config.options?.client,
      ...(IS_BROWSER && { token_endpoint_auth_method: 'none' }),
    },
    checks,
    pages: {
      login: {
        route: `${DEFAULT_LOGIN_ROUTE}/${id}`,
        methods: ['GET'],
      },
      callback: {
        route: `${DEFAULT_CALLBACK_ROUTE}/${id}`,
        methods: ['GET'],
        redirect: DEFAULT_CALLBACK_REDIRECT,
      },
    },
    endpoints: {
      authorization: {
        ...config.authorization,
        ...config.options?.authorization,
        params: {
          client_id: clientId,
          response_type: DEFAULT_RESPONSE_TYPE,
          ...config.authorization?.params,
          ...config.options?.authorization?.params,
        },
      },
      token,
      userinfo,
    },
  }
}
