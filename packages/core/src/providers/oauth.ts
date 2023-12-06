import * as oauth from 'oauth4webapi'

import {
  DEFAULT_CALLBACK_REDIRECT,
  DEFAULT_CALLBACK_ROUTE,
  DEFAULT_LOGIN_ROUTE,
  ISSUER,
} from '../constants'
import { Checker, type CheckerConfig } from '../security/checker'
import type { Cookie } from '../security/cookie'
import type { PageEndpoint } from '../types'
import type { Awaitable, Nullish } from '../utils/types'

import type { Endpoint, Provider, TokenEndpointResponse } from '.'

export type OAuthCheck = 'state' | 'pkce'

export interface OAuthPages {
  login: PageEndpoint
  callback: PageEndpoint
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

  managedEndpoints: PageEndpoint[]

  checker: Checker

  cookies: OAuthCookiesOptions

  constructor(config: OAuthProviderConfig<T>) {
    this.config = config

    this.id = config.id

    this.pages = {
      login: {
        route: config.pages?.login?.route ?? `${DEFAULT_LOGIN_ROUTE}/${this.id}`,
        methods: config.pages?.login?.methods ?? ['GET'],
      },
      callback: {
        route: config.pages?.callback?.route ?? `${DEFAULT_CALLBACK_ROUTE}/${this.id}`,
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

    this.managedEndpoints = [this.pages.login, this.pages.callback]

    this.checker = new Checker(config.checker)
  }

  async handle(request: Aponia.Request): Promise<Aponia.Response | void> {
    if (this.matches(request, this.pages.login)) {
      return this.login(request)
    }

    if (this.matches(request, this.pages.callback)) {
      return this.callback(request)
    }
  }

  async login(request: Aponia.Request): Promise<Aponia.Response> {
    const url = new URL(this.endpoints.authorization.url)

    const params = this.endpoints.authorization.params ?? {}

    const cookies: Cookie[] = []

    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'string') {
        url.searchParams.set(key, value)
      }
    })

    if (!url.searchParams.has('redirect_uri')) {
      url.searchParams.set('redirect_uri', `${request.url.origin}${this.pages.callback}`)
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
      const [verifier, challenge] = await this.checker.createPkce()

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

  async callback(request: Aponia.Request): Promise<Aponia.Response> {
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
      `${request.url.origin}${this.pages.callback}`,
      pkce ?? 'AUTH',
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
   * Whether a {@link Aponia.Request} matches a {@link PageEndpoint}.
   */
  private matches(request: Aponia.Request, pageEndpoint: PageEndpoint): boolean {
    return (
      pageEndpoint.route === request.url.pathname && pageEndpoint.methods.includes(request.method)
    )
  }
}
