import type { OAuthUserConfig, OAuthConfig } from '@auth/core/providers'
import * as oauth from 'oauth4webapi'

import * as checks from '../security/checks'
import { createCookiesOptions } from '../security/cookie'
import type { Cookie, CookiesOptions } from '../security/cookie'
import type { JWTOptions } from '../security/jwt'
import type { Awaitable, Nullish } from '../utils/types'

import type { ProviderPages } from './types'

export type TokenSet = Partial<oauth.OAuth2TokenEndpointResponse>

export interface Endpoint<TContext = any, TResponse = any> {
  url: string
  params?: Record<string, any>
  request?: (context: TContext) => Awaitable<TResponse>
  conform?: (response: Response) => Awaitable<Response | Nullish>
}

/**
 * Internal OAuth configuration.
 */
export interface ResolvedOAuthConfig<TProfile> {
  id: string
  client: oauth.Client
  checks: OAuthConfig<any>['checks']
  pages: ProviderPages
  endpoints: {
    authorization: Endpoint<OAuthProvider<TProfile>>
    token: Endpoint<OAuthProvider<TProfile>, TokenSet>
    userinfo: Endpoint<{ provider: OAuthProvider<TProfile>; tokens: TokenSet }, TProfile>
  }
  onAuth: (
    user: TProfile,
    tokens: oauth.OAuth2TokenEndpointResponse,
  ) => Awaitable<Aponia.InternalResponse | Nullish> | Nullish
}

/**
 * Pre-defined OAuth default configuration.
 */
export interface OAuthDefaultConfig<TProfile>
  extends Pick<ResolvedOAuthConfig<TProfile>, 'id' | 'endpoints'>,
    Omit<OAuthUserConfig<TProfile>, 'id' | 'endpoints' | 'clientId' | 'clientSecret'> {}

/**
 * OAuth provider.
 */
export class OAuthProvider<TProfile> {
  /**
   * Sets the provider __type__ for all instances.
   */
  static type = 'oauth' as const

  /**
   * Forwards the static provider __type__ to an instance's properties.
   */
  type = OAuthProvider.type

  /**
   * Config.
   */
  config: ResolvedOAuthConfig<TProfile>

  /**
   * Authorization server.
   */
  authorizationServer: oauth.AuthorizationServer

  cookiesOptions: CookiesOptions = createCookiesOptions()

  jwt: JWTOptions = { secret: 'secret' }

  constructor(options: ResolvedOAuthConfig<TProfile>) {
    this.config = options

    this.authorizationServer = {
      issuer: 'auth.js',
      authorization_endpoint: options.endpoints.authorization.url,
      token_endpoint: options.endpoints.token.url,
      userinfo_endpoint: options.endpoints.userinfo.url,
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
   * Handle OAuth login request.
   */
  async login(request: Aponia.InternalRequest): Promise<Aponia.InternalResponse> {
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
      const [state, stateCookie] = await checks.state.create(this.config)
      url.searchParams.set('state', state)
      cookies.push(stateCookie)
    }

    if (this.config.checks?.includes('pkce')) {
      const [pkce, pkceCookie] = await checks.pkce.create(this.config)
      url.searchParams.set('code_challenge', pkce)
      url.searchParams.set('code_challenge_method', 'S256')
      cookies.push(pkceCookie)
    }

    return { status: 302, redirect: url.toString(), cookies }
  }

  /**
   * Handle OAuth callback request.
   */
  async callback(request: Aponia.InternalRequest): Promise<Aponia.InternalResponse> {
    const cookies: Cookie[] = []

    const [state, stateCookie] = await checks.state.use(request, this.config)

    if (stateCookie) cookies.push(stateCookie)

    const codeGrantParams = oauth.validateAuthResponse(
      this.authorizationServer,
      this.config.client,
      request.url.searchParams,
      state,
    )

    if (oauth.isOAuth2Error(codeGrantParams)) throw new Error(codeGrantParams.error_description)

    const [pkce, pkceCookie] = await checks.pkce.use(request, this.config)

    if (pkceCookie) cookies.push(pkceCookie)

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

    const profile = await (this.config.endpoints.userinfo.request?.({ provider: this, tokens }) ??
      oauth
        .userInfoRequest(this.authorizationServer, this.config.client, tokens.access_token)
        .then((response) => response.json()))

    if (!profile) {
      throw new Error('TODO: Handle missing profile')
    }

    const processedResponse = (await this.config.onAuth(profile, tokens)) ?? {
      redirect: this.config.pages.callback.redirect,
      status: 302,
    }

    processedResponse.cookies ??= []
    processedResponse.cookies.push(...cookies)

    return processedResponse
  }
}

const defaultOnAuth = <T>(user: T) => ({ user, session: user })

/**
 * Merge user and pre-defined default OAuth options.
 */
export function mergeOAuthOptions(
  userOptions: OAuthUserConfig<any>,
  defaultOptions: OAuthDefaultConfig<any>,
): ResolvedOAuthConfig<any> {
  const id = userOptions.id ?? defaultOptions.id
  const clientId = userOptions.clientId ?? ''
  const clientSecret = userOptions.clientSecret ?? ''

  return {
    id,
    client: {
      client_id: clientId,
      client_secret: clientSecret,
    },
    checks: ['pkce'],
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
      ...defaultOptions.endpoints,
      authorization: {
        ...defaultOptions.endpoints.authorization,
        params: {
          client_id: userOptions.clientId,
          response_type: 'code',
        },
      },
    },
    onAuth: defaultOnAuth,
  }
}
