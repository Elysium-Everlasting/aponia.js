import * as oauth from 'oauth4webapi'

import {
  DEFAULT_CALLBACK_REDIRECT,
  DEFAULT_CALLBACK_ROUTE,
  DEFAULT_LOGIN_ROUTE,
  FIFTEEN_MINUTES_IN_SECONDS,
  ISSUER,
  PKCE_NAME,
  STATE_NAME,
} from '../constants'
import type { PluginCoordinator } from '../plugin'
import { Checker, type CheckerConfig } from '../security/checker'
import {
  getCookiePrefix,
  type Cookie,
  type CookieOption,
  type CreateCookiesOptions,
} from '../security/cookie'
import type { Route } from '../types'
import type { Awaitable, Nullish } from '../utils/types'

import type { Endpoint, Provider, TokenEndpointResponse } from '.'

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
  clientSecret?: string
  client?: oauth.Client
  pages?: Partial<OAuthPages>
  endpoints?: Partial<OAuthEndpoints<T>>
  profile?: (profile: T, tokens: TokenEndpointResponse) => Awaitable<Aponia.User | Nullish>
  checker?: CheckerConfig
  cookies?: CreateCookiesOptions
}

export class OAuthProvider<T> implements Provider {
  config: OAuthProviderConfig<T>

  id: string

  pages: OAuthPages

  endpoints: OAuthEndpoints<T>

  client: oauth.Client

  authorizationServer: oauth.AuthorizationServer

  routes: Route[]

  checker: Checker

  cookies: OAuthCookiesOptions

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
        url: '',
        params: {
          client_id: '',
          response_type: 'code',
          ...config.endpoints?.authorization?.params,
        },
      },
      token: { url: '' },
      userinfo: { url: '' },
      ...config.endpoints,
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

    this.cookies = createOAuthCookiesOptions({
      ...config.cookies,
      serialize: {
        path: '/',
        sameSite: 'lax',
        ...config.cookies?.serialize,
      },
    })

    this.checker = new Checker(config.checker)
  }

  public initialize(plugin: PluginCoordinator) {
    plugin.on('cookies', (options) => {
      this.cookies = createOAuthCookiesOptions({
        ...options,
        serialize: {
          path: '/',
          sameSite: 'lax',
          ...options?.serialize,
        },
      })
    })

    plugin.on('checker', (config) => {
      this.checker.setConfig(config)
    })
  }

  public async handle(request: Aponia.Request): Promise<Aponia.Response | void> {
    if (this.matches(request, this.pages.login)) {
      return this.login(request)
    }

    if (this.matches(request, this.pages.callback)) {
      return this.callback(request)
    }
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
      url.searchParams.set('redirect_uri', `${request.url.origin}${this.pages.callback.path}`)
    }

    if (this.checker.checks.includes('state')) {
      const state = await this.checker.createState()

      url.searchParams.set('state', state)

      cookies.push({
        name: this.cookies.state.name,
        value: state,
        options: this.cookies.state.options,
      })
    }

    if (this.checker.checks.includes('pkce')) {
      const [challenge, verifier] = await this.checker.createPkce()

      url.searchParams.set('code_challenge', challenge)
      url.searchParams.set('code_challenge_method', 'S256')

      cookies.push({
        name: this.cookies.pkce.name,
        value: verifier,
        options: this.cookies.pkce.options,
      })
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
      throw new Error(codeGrantParams.error_description)
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
      throw new Error('TODO: Handle www-authenticate challenges as needed')
    }

    const tokens = await oauth.processAuthorizationCodeOAuth2Response(
      this.authorizationServer,
      this.client,
      codeGrantResponse,
    )

    if (oauth.isOAuth2Error(tokens)) {
      throw new Error('TODO: Handle OAuth 2.0 response body error')
    }

    const profile = await (this.endpoints.userinfo.request?.({
      provider: this.endpoints,
      tokens,
    }) ??
      oauth
        .userInfoRequest(this.authorizationServer, this.client, tokens.access_token)
        .then((response) => response.json()))

    if (!profile) {
      throw new Error('TODO: Handle missing profile')
    }

    const response: Aponia.Response = {
      user: (await this.config.profile?.(profile, tokens)) ?? profile,
      status: 302,
      cookies,
      redirect: this.pages.redirect,
    }

    return response
  }

  /**
   * Whether a {@link Aponia.Request} matches a {@link Route}.
   */
  private matches(request: Aponia.Request, pageEndpoint: Route): boolean {
    return (
      pageEndpoint.path === request.url.pathname && pageEndpoint.methods.includes(request.method)
    )
  }
}

export function createOAuthCookiesOptions(options?: CreateCookiesOptions): OAuthCookiesOptions {
  const cookiePrefix = getCookiePrefix(options)
  const serializeOptions = { ...options?.serialize }

  return {
    pkce: {
      name: `${cookiePrefix}.${PKCE_NAME}`,
      options: {
        maxAge: FIFTEEN_MINUTES_IN_SECONDS,
        ...serializeOptions,
      },
    },
    state: {
      name: `${cookiePrefix}.${STATE_NAME}`,
      options: {
        maxAge: FIFTEEN_MINUTES_IN_SECONDS,
        ...serializeOptions,
      },
    },
  }
}

export interface OAuthCookiesOptions {
  pkce: CookieOption
  state: CookieOption
}
