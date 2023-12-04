import type { OAuthConfig, OAuthUserConfig } from '@auth/core/providers'
import type { TokenSet } from '@auth/core/types'
import * as oauth from 'oauth4webapi'

import {
  DEFAULT_CALLBACK_REDIRECT,
  DEFAULT_CALLBACK_ROUTE,
  DEFAULT_CHECKS,
  DEFAULT_LOGIN_ROUTE,
  ISSUER,
} from '../constants'
import * as checks from '../security/checks'
import { DEFAULT_COOKIES_OPTIONS } from '../security/cookie'
import type { Cookie, CookiesOptions } from '../security/cookie'
import { DEFAULT_JWT_OPTIONS, type JWTOptions } from '../security/jwt'
import type { Endpoint, InternalRequest, InternalResponse, ProviderPages } from '../types'

export type ResolvedOAuthConfig<TProfile> = {
  id: string
  client: oauth.Client
  checks: OAuthConfig<any>['checks']
  pages: ProviderPages
  endpoints: {
    authorization: Endpoint<OAuthProvider<TProfile>>
    token: Endpoint<OAuthProvider<TProfile>, TokenSet>
    userinfo: Endpoint<{ provider: OAuthConfig<TProfile>; tokens: TokenSet }, TProfile>
  }
} & OAuthConfig<TProfile>

export class OAuthProvider<TProfile> {
  static type = 'oauth' as const

  type = OAuthProvider.type

  config: ResolvedOAuthConfig<TProfile>

  authorizationServer: oauth.AuthorizationServer

  cookiesOptions = DEFAULT_COOKIES_OPTIONS

  jwt = DEFAULT_JWT_OPTIONS

  constructor(options: ResolvedOAuthConfig<TProfile>) {
    this.config = options

    this.authorizationServer = {
      issuer: ISSUER,
      authorization_endpoint: options.endpoints.authorization.url,
      token_endpoint: options.endpoints.token.url,
      userinfo_endpoint: options.endpoints.userinfo.url,
    }
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

  async login(request: InternalRequest): Promise<InternalResponse> {
    const url = new URL(this.config.endpoints.authorization.url)

    const cookies: Cookie[] = []

    const params = this.config.endpoints.authorization.params ?? {}

    Object.entries(params).forEach(([key, value]) => {
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

    return { status: 302, redirect: url.toString(), cookies }
  }

  async callback(request: InternalRequest): Promise<InternalResponse> {
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
      (await this.config.endpoints.token.conform?.(initialCodeGrantResponse.clone())) ??
      initialCodeGrantResponse

    const challenges = oauth.parseWwwAuthenticateChallenges(codeGrantResponse)

    if (challenges) {
      challenges.forEach((challenge) => {
        console.log('challenge', challenge)
      })
      throw new Error('TODO: Handle www-authenticate challenges as needed')
    }

    const tokens = await oauth.processAuthorizationCodeOAuth2Response(
      this.authorizationServer,
      this.config.client,
      codeGrantResponse,
    )

    if (oauth.isOAuth2Error(tokens)) {
      throw new Error('TODO: Handle OAuth 2.0 response body error')
    }

    const profile = await (this.config.endpoints.userinfo.request?.({
      provider: this.config,
      tokens,
    }) ??
      oauth
        .userInfoRequest(this.authorizationServer, this.config.client, tokens.access_token)
        .then((response) => response.json()))

    if (!profile) {
      throw new Error('TODO: Handle missing profile')
    }

    const processedResponse: InternalResponse = (await this.config.onAuth?.(
      profile,
      tokens,
      request,
    )) ?? {
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

export function resolveOAuthConfig(
  config: OAuthConfig<any> & { options?: OAuthUserConfig<any> },
): ResolvedOAuthConfig<any> {
  const id = config.id ?? config.options?.id ?? ''
  const clientId = config.clientId ?? config.options?.clientId ?? ''
  const clientSecret = config.clientSecret ?? config.options?.clientSecret ?? ''
  const checks: any = config.checks ?? config.options?.checks ?? DEFAULT_CHECKS
  const token = config.token ?? config.options?.token ?? {}
  const userinfo = config.userinfo ?? config.options?.userinfo ?? {}

  return {
    ...config,
    ...config.options,
    id,
    client: {
      ...config.client,
      ...config.options?.client,
      client_id: clientId,
      client_secret: clientSecret,
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
          response_type: 'code',
          ...config.authorization?.params,
          ...config.options?.authorization?.params,
        },
      },
      token: typeof token === 'string' ? { url: token } : token,
      userinfo: typeof userinfo === 'string' ? { url: userinfo } : userinfo,
    },
  }
}
