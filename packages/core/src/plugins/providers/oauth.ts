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
} from '../../constants'
import { Logger } from '../../logger'
import { Checker, type CheckerConfig } from '../../security/checker'
import {
  getCookiePrefix,
  type Cookie,
  type CookieOption,
  type CreateCookiesOptions,
  DEFAULT_CREATE_COOKIES_OPTIONS,
  getCookieValue,
} from '../../security/cookie'
import type { Awaitable, Nullish } from '../../utils/types'
import type { Plugin, PluginContext, PluginOptions } from '../plugin'

/**
 * Custom endpoint to use during the OAuth flow.
 */
export interface OAuthEndpoint<TContext = any, TResponse = any> {
  /**
   * The URL to use for the endpoint.
   */
  url: string

  /**
   * The URLSearchParams to append.
   */
  params?: Record<string, any>

  /**
   * Override the default request function.
   */
  request?: (context: TContext) => Awaitable<TResponse>

  /**
   * Process the response returned by the default request function.
   */
  conform?: (response: Response) => Awaitable<Response | Nullish>
}

/**
 * Tokens that can be returned by the token endpoint.
 */
export type TokenEndpointResponse =
  | oauth.OAuth2TokenEndpointResponse
  | oauth.OpenIDTokenEndpointResponse

/**
 * Pages that are recognized by the provider.
 */
export interface OAuthPages {
  /**
   * Login.
   */
  login: string

  /**
   * Callback.
   */
  callback: string

  /**
   * Where to redirect after logging in.
   */
  redirect: string
}

/**
 * Endpoints used during the OAuth flow.
 */
export interface OAuthEndpoints<T> {
  /**
   * Authorization.
   */
  authorization: OAuthEndpoint<OAuthProvider<T>>

  /**
   * Token.
   */
  token: OAuthEndpoint<OAuthProvider<T>, TokenEndpointResponse>

  /**
   * User info.
   */
  userinfo: OAuthEndpoint<{ provider: OAuthEndpoints<T>; tokens: TokenEndpointResponse }, T>
}

/**
 * Configuration for an OAuth provider.
 */
export interface OAuthProviderConfig<T> {
  /**
   * Unique identifier for the provider. May be used by other integrations.
   */
  id: string

  /**
   * Client ID.
   */
  clientId: string

  /**
   * Client secret.
   */
  clientSecret: string

  /**
   * OAuth client.
   */
  client?: oauth.Client

  /**
   * Information about pages that are recognized by this provider.
   */
  pages?: Partial<OAuthPages>

  /**
   * Customize the endpoints used by this provider.
   */
  endpoints?: Partial<OAuthEndpoints<T>>

  /**
   * Transform the profile returned by the user info endpoint.
   */
  profile?: (
    profile: T,
    tokens: TokenEndpointResponse,
  ) => Awaitable<Aponia.ProviderAccount | Nullish>

  /**
   * Applies security checks to the OAuth request.
   */
  checker?: CheckerConfig

  /**
   * Cookie options used by this provider when setting the security cookies.
   */
  cookies?: CreateCookiesOptions

  /**
   * Logger.
   */
  logger?: Logger

  origin?: string

  /**
   * Override values returned by the discovery request.
   */
  authorizationServer?: Partial<oauth.AuthorizationServer>
}

export class OAuthProvider<T = any> implements Plugin {
  static type = 'oauth' as const

  type = OAuthProvider.type

  /**
   * The originally provided configuration.
   */
  config: OAuthProviderConfig<T>

  /**
   */
  id: string

  /**
   * Information about pages that are recognized by this provider.
   */
  pages: OAuthPages

  /**
   * Customize the endpoints used by this provider.
   */
  endpoints: OAuthEndpoints<T>

  /**
   * OAuth client configuration used to interface with the {@link oauth} library.
   */
  client: oauth.Client

  /**
   * Authorization server.
   */
  authorizationServer: oauth.AuthorizationServer

  /**
   * Applies security checks to the OAuth request.
   */
  checker: Checker

  /**
   * Cookie options used by this provider when setting the security cookies.
   */
  cookies: OAuthCookiesOptions

  /**
   * Logger.
   */
  logger: Logger

  /**
   * Proxy for callback.
   * @remarks Only applies to callback!!
   */
  origin?: string

  constructor(config: OAuthProviderConfig<T>) {
    this.config = config
    this.id = config.id
    this.pages = {
      login: config.pages?.login ?? `${DEFAULT_LOGIN_ROUTE}/${this.id}`,
      callback: config.pages?.callback ?? `${DEFAULT_CALLBACK_ROUTE}/${this.id}`,
      redirect: config.pages?.redirect ?? DEFAULT_CALLBACK_REDIRECT,
    }

    const authorizationUrl = config.endpoints?.authorization?.url
    if (authorizationUrl == null) {
      throw new Error('Missing authorization URL')
    }

    const tokenUrl = config.endpoints?.token?.url
    if (tokenUrl == null) {
      throw new Error('Missing token URL')
    }

    const userinfoUrl = config.endpoints?.userinfo?.url
    if (userinfoUrl == null) {
      throw new Error('Missing userinfo URL')
    }

    this.endpoints = {
      authorization: {
        ...config.endpoints?.authorization,
        url: authorizationUrl,
      },
      token: {
        ...config.endpoints?.token,
        url: tokenUrl,
      },
      userinfo: {
        ...config.endpoints?.userinfo,
        url: userinfoUrl,
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

      /**
       * Override default configuration with values provided by the user.
       */
      ...this.config.authorizationServer,
    }
    this.cookies = DEFAULT_OAUTH_COOKIES_OPTIONS
    this.checker = new Checker(config.checker)
    this.logger = config.logger ?? new Logger()
    this.origin = config.origin
  }

  initialize(context: PluginContext, options: PluginOptions): Awaitable<void> {
    if (options.logger) {
      this.logger = options.logger
    }

    this.cookies = createOAuthCookiesOptions({
      ...DEFAULT_CREATE_COOKIES_OPTIONS,
      ...options,
      serialize: {
        ...DEFAULT_CREATE_COOKIES_OPTIONS.serialize,
        ...options?.cookieOptions?.serialize,
      },
    })

    if (options.origin != null) {
      this.origin = options.origin
    }

    context.router.get(this.pages.login, this.login.bind(this))
    context.router.get(this.pages.callback, this.callback.bind(this))
  }

  public async login(request?: Aponia.Request): Promise<Aponia.Response> {
    const url = new URL(this.endpoints.authorization.url)
    const cookies: Cookie[] = []
    const params = this.endpoints.authorization.params ?? {}

    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'string') {
        url.searchParams.set(key, value)
      }
    })

    if (!url.searchParams.has('redirect_uri') && request != null) {
      const redirectUri = `${request.url.origin}${this.pages.callback}`
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

    return {
      status: 302,
      redirect: url.toString(),
      cookies,
      providerType: this.type,
      providerId: this.id,
    }
  }

  public async callback(request: Aponia.Request): Promise<Aponia.Response> {
    const cookies: Cookie[] = []

    const stateCookie = getCookieValue(request.cookies, this.cookies.state.name)

    const state = await this.checker.useState(stateCookie)

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

    const pkceCookie = getCookieValue(request.cookies, this.cookies.pkce.name)

    const pkce = await this.checker.usePkce(pkceCookie)

    if (pkce) {
      cookies.push({
        name: this.cookies.pkce.name,
        value: '',
        options: { ...this.cookies.pkce.options, maxAge: 0 },
      })
    }

    const origin = this.origin ?? request.url.origin

    const initialCodeGrantResponse = await oauth.authorizationCodeGrantRequest(
      this.authorizationServer,
      this.client,
      codeGrantParams,
      `${origin}${this.pages.callback}`,
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

    const account = (await this.config.profile?.(profile, tokens)) as Aponia.ProviderAccount

    try {
      const response: Aponia.Response = {
        account,
        providerAccountMapping: {
          [this.id]: account,
        },
        status: 302,
        cookies,
        redirect: this.pages.redirect,
        providerType: this.type,
        providerId: this.id,
        providerAccountId: profile.id,
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
