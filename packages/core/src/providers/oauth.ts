import * as oauth from 'oauth4webapi'

import {
  DEFAULT_CALLBACK_REDIRECT,
  DEFAULT_CALLBACK_ROUTE,
  DEFAULT_LOGIN_ROUTE,
  ISSUER,
} from '../constants'
import type { Cookie } from '../cookie'
import type { Awaitable, Nullish } from '../utils/types'

import type { Endpoint, Provider, TokenEndpointResponse } from '.'

export type OAuthCheck = 'state' | 'pkce'

export interface OAuthPages {
  login: string
  callback: string
  redirect: string
}

export interface OAuthEndpoints<T> {
  authorization: Endpoint<OAuthProvider<T>>
  token: Endpoint<OAuthProvider<T>, TokenEndpointResponse>
  userinfo: Endpoint<{ provider: OAuthProvider<T>; tokens: TokenEndpointResponse }, T>
}

export interface OAuthProviderConfig<T> {
  id: string
  clientId: string
  clientSecret?: string
  client?: oauth.Client
  checks?: OAuthCheck[]
  pages?: Partial<OAuthPages>
  endpoints?: Partial<OAuthEndpoints<T>>
  profile?: (profile: T, tokens: TokenEndpointResponse) => Awaitable<Aponia.User | Nullish>
}

export class OAuthProvider<T> implements Provider {
  config: OAuthProviderConfig<T>

  id: string

  checks: OAuthCheck[]

  pages: OAuthPages

  endpoints: OAuthEndpoints<T>

  client: oauth.Client

  authorizationServer: oauth.AuthorizationServer

  constructor(config: OAuthProviderConfig<T>) {
    this.config = config

    this.id = config.id

    this.checks = config.checks ?? ['pkce']

    this.pages = {
      login: config.pages?.login ?? `${DEFAULT_LOGIN_ROUTE}/${this.id}`,
      callback: config.pages?.callback ?? `${DEFAULT_CALLBACK_ROUTE}/${this.id}`,
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
      ...config.endpoints,
      token: { url: '' },
      userinfo: { url: '' },
    }

    this.client = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }

    this.authorizationServer = {
      issuer: ISSUER,
      authorization_endpoint: this.endpoints.authorization.url,
      token_endpoint: this.endpoints.token.url,
      userinfo_endpoint: this.endpoints.userinfo.url,
    }
  }

  get checkParams(): checks.CheckParams {
    return {
      checks: this.checks,
      cookies: this.cookiesOptions,
    }
  }

  routes(): string[] {
    return []
  }

  async handle(request: Aponia.Request): Promise<Aponia.Response> {
    request
    return {}
  }

  async login(request: Aponia.Request): Promise<Aponia.Response> {
    const url = new URL(this.endpoints.authorization.url)

    const cookies: Cookie[] = []

    const params = this.endpoints.authorization.params ?? {}

    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'string') {
        url.searchParams.set(key, value)
      }
    })

    if (!url.searchParams.has('redirect_uri')) {
      url.searchParams.set('redirect_uri', `${request.url.origin}${this.pages.callback}`)
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

  async callback(request: Aponia.Request): Promise<Aponia.Response> {
    const cookies: Cookie[] = []

    const [state, stateCookie] = await checks.state.use(request, this.checkParams)

    if (stateCookie) cookies.push(stateCookie)

    const codeGrantParams = oauth.validateAuthResponse(
      this.authorizationServer,
      this.client,
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
      this.client,
      codeGrantParams,
      `${request.url.origin}${this.pages.callback}`,
      pkce,
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

    const profile = await (this.endpoints.userinfo.request?.({ provider: this, tokens }) ??
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
      redirect: this.pages.callback,
    }

    return response
  }
}
