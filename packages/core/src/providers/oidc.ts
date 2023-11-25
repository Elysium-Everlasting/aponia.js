import type { OIDCConfig, OIDCUserConfig } from '@auth/core/providers'
import * as oauth from 'oauth4webapi'

import * as checks from '../security/checks'
import { defaultCookiesOptions, type Cookie, type CookiesOptions } from '../security/cookie'
import { defaultJWTOptions, type JWTOptions } from '../security/jwt'
import type { Awaitable, Nullish } from '../utils/types'

import type { ProviderPages } from './types'

export type TokenSet = Partial<oauth.OAuth2TokenEndpointResponse>

interface Endpoint<TContext = any, TResponse = any> {
  params?: Record<string, any>
  request?: (context: TContext) => Awaitable<TResponse>
  conform?: (response: Response) => Awaitable<Response | Nullish>
}

/**
 * Internal OIDC configuration.
 *
 * @internal
 */
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
  ) => Awaitable<Aponia.InternalResponse | Nullish> | Nullish
} & OIDCConfig<TProfile>

/**
 * Pre-defined OIDC default configuration.
 */
export interface OIDCDefaultConfig<TProfile>
  extends Pick<ResolvedOIDCConfig<TProfile>, 'id' | 'issuer'>,
    Omit<OIDCConfig<TProfile>, 'id' | 'issuer' | 'clientId' | 'clientSecret'> {}

/**
 * OIDC provider.
 */
export class OIDCProvider<TProfile> {
  /**
   * Sets the provider __type__ for all instances.
   */
  static type = 'oidc' as const

  /**
   * Forwards the static provider __type__ to an instance's properties.
   */
  type = OIDCProvider.type

  /**
   * Config.
   */
  config: ResolvedOIDCConfig<TProfile>

  /**
   * Authorization server.
   */
  authorizationServer: oauth.AuthorizationServer

  cookiesOptions = defaultCookiesOptions

  jwt = defaultJWTOptions

  constructor(options: ResolvedOIDCConfig<TProfile>) {
    this.config = options
    this.authorizationServer = { issuer: options.issuer }
  }

  /**
   * The provider configures the behavior of the OAuth checks.
   */
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

  /**
   * Dynamically initialize OIDC authorization server.
   */
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

  /**
   * Handle OAuth login request.
   */
  async login(request: Aponia.InternalRequest): Promise<Aponia.InternalResponse> {
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

  /**
   * Handle OAuth callback request.
   */
  async callback(request: Aponia.InternalRequest): Promise<Aponia.InternalResponse> {
    await this.initialize()

    const cookies: Cookie[] = []

    const [state, stateCookie] = await checks.state.use(request, this.checkParams)

    if (stateCookie) cookies.push(stateCookie)

    const codeGrantParams = oauth.validateAuthResponse(
      this.authorizationServer,
      this.config.client,
      request.url.searchParams,
      state,
    )

    if (oauth.isOAuth2Error(codeGrantParams)) {
      throw new Error(codeGrantParams.error_description)
    }

    const [pkce, pkceCookie] = await checks.pkce.use(request, this.checkParams)

    if (pkceCookie) cookies.push(pkceCookie)

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

    const profile = oauth.getValidatedIdTokenClaims(tokens) as TProfile

    const processedResponse: Aponia.InternalResponse = (await this.config.onAuth?.(
      profile,
      tokens,
    )) ?? {
      user: ((await this.config.profile?.(profile, tokens)) ?? profile) as any,
      redirect: this.config.pages.callback.redirect,
      status: 302,
    }

    processedResponse.cookies ??= []
    processedResponse.cookies.push(...cookies)

    return processedResponse
  }
}

/**
 * Merges the user options with the pre-defined default options.
 */
export function resolveOIDCConfig(
  config: OIDCConfig<any> & { options?: OIDCUserConfig<any> },
): ResolvedOIDCConfig<any> {
  const id = config.id ?? config.options?.id ?? ''
  const clientId = config.clientId ?? config.options?.clientId ?? ''
  const clientSecret = config.clientSecret ?? config.options?.clientSecret ?? ''
  const issuer = config.issuer ?? config.options?.issuer ?? ''
  const checks: any = config.checks ?? config.options?.checks ?? ['pkce']
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
    },
    checks,
    pages: {
      login: {
        route: `/auth/login/${id}`,
        methods: ['GET'],
      },
      callback: {
        route: `/auth/callback/${id}`,
        methods: ['GET'],
        redirect: '/',
      },
    },
    endpoints: {
      authorization: {
        ...config.authorization,
        ...config.options?.authorization,
        params: {
          client_id: clientId,
          response_type: 'code',
          ...config.authorization?.params,
          ...config.options?.authorization?.params,
        },
      },
      token,
      userinfo,
    },
  }
}
