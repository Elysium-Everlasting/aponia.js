import * as oauth from 'oauth4webapi'

import {
  DEFAULT_CALLBACK_REDIRECT,
  DEFAULT_CALLBACK_ROUTE,
  DEFAULT_LOGIN_ROUTE,
  ISSUER,
  PKCE_MAX_AGE,
  PKCE_NAME,
  STATE_MAX_AGE,
  STATE_NAME,
} from '../constants'
import { requestMatchesRoute, type Handler } from '../handler'
import { Logger } from '../logger'
import { Checker, type CheckerConfig } from '../security/checker'
import {
  getCookiePrefix,
  type Cookie,
  type CookieOption,
  type CreateCookiesOptions,
  DEFAULT_CREATE_COOKIES_OPTIONS,
} from '../security/cookie'
import type { Route } from '../types'
import type { Awaitable, Nullish } from '../utils/types'

export interface Endpoint<TContext = any, TResponse = any> {
  url: string
  params?: Record<string, any>
  request?: (context: TContext) => Awaitable<TResponse>
  conform?: (response: Response) => Awaitable<Response | Nullish>
}

export type TokenEndpointResponse =
  | oauth.OAuth2TokenEndpointResponse
  | oauth.OpenIDTokenEndpointResponse

export type OAuthCheck = 'state' | 'pkce'

export interface OAuthPages {
  login: Route
  callback: Route
  redirect: string
}

export interface OAuthEndpoints<T> {
  authorization: Endpoint<OAuthProvider<T>>
  token: Endpoint<OAuthProvider<T>, TokenEndpointResponse>
  userinfo: Endpoint<{ provider: OAuthEndpoints<T>; tokens: TokenEndpointResponse }, T>
}

export interface OAuthProviderConfig<T> {
  id: string
  clientId: string
  clientSecret: string
  client?: oauth.Client
  pages?: Partial<OAuthPages>
  endpoints?: Partial<OAuthEndpoints<T>>
  profile?: (profile: T, tokens: TokenEndpointResponse) => Awaitable<Aponia.User | Nullish>
  checker?: CheckerConfig
  cookies?: CreateCookiesOptions
  logger?: Logger
}

export class OAuthProvider<T = any> implements Handler {
  config: OAuthProviderConfig<T>
  id: string
  pages: OAuthPages
  endpoints: OAuthEndpoints<T>
  client: oauth.Client
  authorizationServer: oauth.AuthorizationServer
  routes: Route[]
  checker: Checker
  cookies: OAuthCookiesOptions
  logger: Logger

  constructor(config: OAuthProviderConfig<T>) {
    this.config = config
    this.id = config.id
    this.pages = {
      login: {
        path: config.pages?.login?.path ?? `${DEFAULT_LOGIN_ROUTE}/${this.id}`,
        methods: config.pages?.login?.methods ?? ['GET'],
      },
      callback: {
        path: config.pages?.callback?.path ?? `${DEFAULT_CALLBACK_ROUTE}/${this.id}`,
        methods: config.pages?.callback?.methods ?? ['GET'],
      },
      redirect: config.pages?.redirect ?? DEFAULT_CALLBACK_REDIRECT,
    }
    this.endpoints = {
      authorization: {
        ...config.endpoints?.authorization,
        url: config.endpoints?.authorization?.url ?? '',
        params: {
          client_id: config.clientId,
          response_type: 'code',
          ...config.endpoints?.authorization?.params,
        },
      },
      token: {
        url: config.endpoints?.token?.url ?? '',
        ...config.endpoints?.token,
      },
      userinfo: {
        url: config.endpoints?.userinfo?.url ?? '',
        ...config.endpoints?.userinfo,
      },
    }
    this.client = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      ...config.client,
    }
    this.authorizationServer = {
      issuer: ISSUER,
      authorization_endpoint: this.endpoints.authorization.url,
      token_endpoint: this.endpoints.token.url,
      userinfo_endpoint: this.endpoints.userinfo.url,
    }
    this.routes = [this.pages.login, this.pages.callback]
    this.cookies = DEFAULT_OAUTH_COOKIES_OPTIONS
    this.checker = new Checker(config.checker)
    this.logger = config.logger ?? new Logger()
  }

  public setLogger(logger = this.logger) {
    this.logger = logger
  }

  public setCookiesOptions(options?: CreateCookiesOptions) {
    this.cookies = createOAuthCookiesOptions({
      ...DEFAULT_CREATE_COOKIES_OPTIONS,
      ...options,
      serialize: {
        ...DEFAULT_CREATE_COOKIES_OPTIONS.serialize,
        ...options?.serialize,
      },
    })
  }

  public async handle(request: Aponia.Request): Promise<Aponia.Response> {
    if (requestMatchesRoute(request, this.pages.login)) {
      return this.login(request)
    }

    if (requestMatchesRoute(request, this.pages.callback)) {
      return this.callback(request)
    }

    return {}
  }

  public async login(request: Aponia.Request): Promise<Aponia.Response> {
    const url = new URL(this.endpoints.authorization.url)

    const params = this.endpoints.authorization.params ?? {}

    const cookies: Cookie[] = []

    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'string') {
        url.searchParams.set(key, value)
      }
    })

    if (!url.searchParams.has('redirect_uri')) {
      const redirectUri = `${request.url.origin}${this.pages.callback.path}`

      this.logger.debug(`Automatically adding redirect_uri: ${redirectUri}`)

      url.searchParams.set('redirect_uri', redirectUri)
    }

    if (this.checker.checks.includes('state')) {
      try {
        const state = await this.checker.createState()

        url.searchParams.set('state', state)

        cookies.push({
          name: this.cookies.state.name,
          value: state,
          options: this.cookies.state.options,
        })
      } catch (error) {
        this.logger.error(`Failed to create state: ${error}`)
      }
    }

    if (this.checker.checks.includes('pkce')) {
      try {
        const [challenge, verifier] = await this.checker.createPkce()

        url.searchParams.set('code_challenge', challenge)
        url.searchParams.set('code_challenge_method', 'S256')

        cookies.push({
          name: this.cookies.pkce.name,
          value: verifier,
          options: this.cookies.pkce.options,
        })
      } catch (error) {
        this.logger.error(`Failed to create PKCE: ${error}`)
      }
    }

    return { status: 302, redirect: url.toString(), cookies }
  }

  public async callback(request: Aponia.Request): Promise<Aponia.Response> {
    const cookies: Cookie[] = []

    const state = await this.checker.useState(request.cookies[this.cookies.state.name])

    cookies.push({
      name: this.cookies.state.name,
      value: '',
      options: { ...this.cookies.state.options, maxAge: 0 },
    })

    const codeGrantParams = oauth.validateAuthResponse(
      this.authorizationServer,
      this.client,
      request.url.searchParams,
      state,
    )

    if (oauth.isOAuth2Error(codeGrantParams)) {
      const error = new Error(codeGrantParams.error_description)

      this.logger.error(error)

      return { error }
    }

    const pkce = await this.checker.usePkce(request.cookies[this.cookies.pkce.name])

    if (pkce) {
      cookies.push({
        name: this.cookies.pkce.name,
        value: '',
        options: { ...this.cookies.pkce.options, maxAge: 0 },
      })
    }

    const initialCodeGrantResponse = await oauth.authorizationCodeGrantRequest(
      this.authorizationServer,
      this.client,
      codeGrantParams,
      `${request.url.origin}${this.pages.callback.path}`,
      pkce ?? 'auth',
    )

    const codeGrantResponse =
      (await this.endpoints.token.conform?.(initialCodeGrantResponse.clone())) ??
      initialCodeGrantResponse

    const challenges = oauth.parseWwwAuthenticateChallenges(codeGrantResponse)

    if (challenges) {
      challenges.forEach((challenge) => {
        console.log('challenge', challenge)
      })

      const error = new Error('TODO: Handle www-authenticate challenges as needed')

      this.logger.error(error)

      return { error }
    }

    const tokens = await oauth.processAuthorizationCodeOAuth2Response(
      this.authorizationServer,
      this.client,
      codeGrantResponse,
    )

    if (oauth.isOAuth2Error(tokens)) {
      const error = new Error(tokens.error_description)

      this.logger.error(error)

      return { error }
    }

    const profile = await (this.endpoints.userinfo.request?.({
      provider: this.endpoints,
      tokens,
    }) ??
      oauth
        .userInfoRequest(this.authorizationServer, this.client, tokens.access_token)
        .then((response) => response.json()))

    if (profile == null) {
      const error = new Error('TODO: Handle missing profile')

      this.logger.error(error)

      return { error }
    }

    try {
      const response: Aponia.Response = {
        user: (await this.config.profile?.(profile, tokens)) ?? profile,
        status: 302,
        cookies,
        redirect: this.pages.redirect,
      }

      return response
    } catch (error: any) {
      this.logger.error(error)

      return { error }
    }
  }
}

export interface OAuthCookiesOptions {
  pkce: CookieOption
  state: CookieOption
}

export function createOAuthCookiesOptions(options?: CreateCookiesOptions): OAuthCookiesOptions {
  const cookiePrefix = getCookiePrefix(options)
  const serializeOptions = { ...options?.serialize }

  return {
    pkce: {
      name: `${cookiePrefix}.${PKCE_NAME}`,
      options: {
        maxAge: PKCE_MAX_AGE,
        ...serializeOptions,
      },
    },
    state: {
      name: `${cookiePrefix}.${STATE_NAME}`,
      options: {
        maxAge: STATE_MAX_AGE,
        ...serializeOptions,
      },
    },
  }
}

export const DEFAULT_OAUTH_COOKIES_OPTIONS = createOAuthCookiesOptions(
  DEFAULT_CREATE_COOKIES_OPTIONS,
)
