import * as oauth from 'oauth4webapi'

import {
  DEFAULT_CALLBACK_REDIRECT,
  DEFAULT_CALLBACK_ROUTE,
  DEFAULT_LOGIN_ROUTE,
  ISSUER,
  NONCE_MAX_AGE,
  NONCE_NAME,
} from '../constants'
import { requestMatchesRoute, type Handler } from '../handler'
import { Logger } from '../logger'
import { Checker } from '../security/checker'
import {
  getCookiePrefix,
  type Cookie,
  type CookieOption,
  type CreateCookiesOptions,
  DEFAULT_CREATE_COOKIES_OPTIONS,
} from '../security/cookie'
import type { Route } from '../types'
import type { DeepPartial } from '../utils/types'

import {
  createOAuthCookiesOptions,
  type OAuthCookiesOptions,
  type OAuthEndpoints,
  type OAuthPages,
  type OAuthProviderConfig,
} from './oauth'

/**
 * If the OIDC provider supports discovery, then explicitly defined endpoints are not required.
 */
export interface OIDCProviderDiscoveryConfig<T> {
  issuer: string
  endpoints?: DeepPartial<OAuthEndpoints<T>>
}

/**
 * If the OIDC provider supports discovery, then explicitly defined endpoints are not required.
 */
export interface OIDCProviderNoDiscoveryConfig<T> {
  issuer?: never
  endpoints: OAuthEndpoints<T>
}

/**
 * OIDC provider configuration.
 */
export type OIDCProviderConfig<T> = Omit<OAuthProviderConfig<T>, 'endpoints'> &
  (OIDCProviderDiscoveryConfig<T> | OIDCProviderNoDiscoveryConfig<T>)

/**
 * OIDC (OpenID Connect) provider.
 */
export class OIDCProvider<T = any> implements Handler {
  static type = 'oidc' as const

  type = OIDCProvider.type

  /**
   * The originally provided configuration.
   */
  config: OIDCProviderConfig<T>

  /**
   * Unique identifier for the provider. May be used by other integrations.
   */
  id: string

  /**
   * The OIDC issuer endpoint for discovery.
   * @see https://openid.net/specs/openid-connect-discovery-1_0.html
   */
  issuer?: string

  /**
   * Information about pages that are recognized by this provider.
   */
  pages: OAuthPages

  /**
   * OAuth client configuration used to interface with the {@link oauth} library.
   */
  client: oauth.Client

  /**
   * Authorization server.
   */
  authorizationServer: oauth.AuthorizationServer

  /**
   * Array of routes to register for this provider.
   */
  routes: Route[]

  /**
   * Applies security checks to the OAuth request.
   */
  checker: Checker

  /**
   * Cookie options used by this provider when setting the security cookies.
   */
  cookies: OIDCCookiesOptions

  /**
   * Logger.
   */
  logger: Logger

  constructor(config: OIDCProviderConfig<T>) {
    this.config = config
    this.id = config.id
    this.issuer = config.issuer
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
    this.client = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      ...config.client,
    }
    this.authorizationServer = {
      issuer: ISSUER,
      authorization_endpoint: config.endpoints?.authorization?.url,
      token_endpoint: config.endpoints?.token?.url,
      userinfo_endpoint: config.endpoints?.userinfo?.url,
    }
    this.routes = [this.pages.login, this.pages.callback]
    this.cookies = DEFAULT_OIDC_COOKIES_OPTIONS
    this.checker = new Checker(config.checker)
    this.logger = config.logger ?? new Logger()
  }

  async initialize() {
    if (this.issuer == null) {
      return
    }

    const issuer = new URL(this.issuer)
    const discoveryResponse = await oauth.discoveryRequest(issuer)
    const authorizationServer = await oauth.processDiscoveryResponse(issuer, discoveryResponse)
    const supportsPKCE = authorizationServer.code_challenge_methods_supported?.includes('S256')

    if (this.checker.checks?.includes('pkce') && !supportsPKCE) {
      this.checker.checks = ['nonce']
    }

    this.authorizationServer = authorizationServer
  }

  public setLogger(logger = this.logger) {
    this.logger = logger
  }

  public setCookiesOptions(options?: CreateCookiesOptions) {
    this.cookies = createOIDCCookiesOptions({
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
    await this.initialize()

    if (!this.authorizationServer.authorization_endpoint) {
      throw new TypeError(
        `Invalid authorization endpoint. ${this.authorizationServer.authorization_endpoint}`,
      )
    }

    const url = new URL(this.authorizationServer.authorization_endpoint)
    const cookies: Cookie[] = []
    const params = this.config.endpoints?.authorization?.params ?? {}

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

    if (this.checker.checks?.includes('state')) {
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

    if (this.checker.checks?.includes('pkce')) {
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

    if (this.checker.checks?.includes('nonce')) {
      const nonce = await this.checker.createNonce()
      url.searchParams.set('nonce', nonce)
      cookies.push({
        name: this.cookies.nonce.name,
        value: nonce,
        options: this.cookies.nonce.options,
      })
    }

    return {
      status: 302,
      redirect: url.toString(),
      cookies,
      providerType: this.type,
      providerId: this.id,
    }
  }

  public async callback(request: Aponia.Request): Promise<Aponia.Response> {
    await this.initialize()

    const cookies: Cookie[] = []

    const state = await this.checker.useState(request.cookies[this.cookies.state.name])

    if (state != oauth.skipStateCheck) {
      cookies.push({
        name: this.cookies.state.name,
        value: '',
        options: { ...this.cookies.state.options, maxAge: 0 },
      })
    }

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
      (await this.config.endpoints?.token?.conform?.(initialCodeGrantResponse.clone())) ??
      initialCodeGrantResponse

    const challenges = oauth.parseWwwAuthenticateChallenges(codeGrantResponse)

    if (challenges) {
      challenges.forEach((challenge) => console.log('challenge', challenge))
      throw new Error('TODO: Handle www-authenticate challenges as needed')
    }

    const nonce = await this.checker.useNonce(request.cookies[this.cookies.nonce.name])

    if (nonce) {
      cookies.push({
        name: this.cookies.nonce.name,
        value: '',
        options: { ...this.cookies.nonce.options, maxAge: 0 },
      })
    }

    const tokens = await oauth.processAuthorizationCodeOpenIDResponse(
      this.authorizationServer,
      this.client,
      codeGrantResponse,
      nonce,
    )

    if (oauth.isOAuth2Error(tokens)) {
      throw new Error('TODO: Handle OIDC response body error')
    }

    const profile: any = oauth.getValidatedIdTokenClaims(tokens)

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

export interface OIDCCookiesOptions extends OAuthCookiesOptions {
  nonce: CookieOption
}

export function createOIDCCookiesOptions(options?: CreateCookiesOptions): OIDCCookiesOptions {
  const cookiePrefix = getCookiePrefix(options)
  const serializeOptions = { ...options?.serialize }

  return {
    ...createOAuthCookiesOptions(options),
    nonce: {
      name: `${cookiePrefix}.${NONCE_NAME}`,
      options: {
        maxAge: NONCE_MAX_AGE,
        ...serializeOptions,
      },
    },
  }
}

export const DEFAULT_OIDC_COOKIES_OPTIONS = createOIDCCookiesOptions(DEFAULT_CREATE_COOKIES_OPTIONS)
