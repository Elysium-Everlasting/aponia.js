import type { OAuthConfig, OIDCConfig } from '@auth/core/providers'

import {
  DEFAULT_FORGOT_ROUTE,
  DEFAULT_LOGOUT_REDIRECT,
  DEFAULT_LOGOUT_ROUTE,
  DEFAULT_RESET_ROUTE,
  DEFAULT_UPDATE_ROUTE,
} from '../constants'
import type { CredentialsProvider } from '../providers/credentials'
import type { EmailProvider } from '../providers/email'
import { OAuthProvider, resolveOAuthConfig } from '../providers/oauth.js'
import { OIDCProvider, resolveOIDCConfig } from '../providers/oidc.js'
import type { InternalRequest, InternalResponse, PageEndpoint } from '../types'
import type { Awaitable, Nullish } from '../utils/types'

import { SessionManager, type SessionMangerUserConfig } from './session'

/**
 * The user can pass in a mix of internal providers and exteneral providers from Auth.js .
 */
export type AnyProvider = OAuthConfig<any> | OIDCConfig<any> | CredentialsProvider | EmailProvider

/**
 * A resolved provider has the correct internal interface.
 */
export type AnyResolvedProvider =
  | OAuthProvider<any>
  | OIDCProvider<any>
  | CredentialsProvider
  | EmailProvider

/**
 * Static auth pages handled by the framework.
 */
export interface AuthPages {
  /**
   * Log a user out.
   */
  logout: PageEndpoint

  /**
   * Update a user's info.
   */
  update: PageEndpoint

  /**
   * Submit a "forgot password" request.
   */
  forgot: PageEndpoint

  /**
   * Reset a user's password, i.e. after receiving a "forgot password" response.
   */
  reset: PageEndpoint

  /**
   * Where to redirect the user after logging in.
   */
  logoutRedirect?: string
}

/**
 * Callbacks for static auth pages.
 */
export type AuthCallbacks = {
  [k in keyof AuthPages]?: (request: InternalRequest) => Awaitable<InternalResponse | Nullish>
}

/**
 * Auth configuration.
 */
export interface AuthConfig {
  adapter?: Adapter | Adapter[]

  /**
   * Session manager. Handles session creation, validation / decoding, and destruction.
   */
  session: SessionManager | SessionMangerUserConfig

  /**
   * Providers to use for authentication.
   */
  providers: AnyProvider[]

  /**
   * Static auth pages.
   */
  pages?: Partial<AuthPages>

  /**
   * Callbacks for static auth pages.
   */
  callbacks?: Partial<AuthCallbacks>
}

/**
 * Auth framework.
 */
export class Auth {
  session: SessionManager

  providers: AnyResolvedProvider[]

  pages: AuthPages

  callbacks: Partial<AuthCallbacks>

  routes: {
    login: Map<string, AnyResolvedProvider>
    callback: Map<string, AnyResolvedProvider>
  }

  constructor(config: AuthConfig) {
    this.providers = config.providers.map((provider) => {
      switch (provider.type) {
        case 'email':
          return provider

        case 'credentials':
          return provider

        case 'oauth':
          return new OAuthProvider(resolveOAuthConfig(provider))

        case 'oidc':
          return new OIDCProvider(resolveOIDCConfig(provider))
      }
    })

    this.session =
      config.session instanceof SessionManager ? config.session : new SessionManager(config.session)

    this.session.config.pages.logoutRedirect ??=
      config.pages?.logoutRedirect ?? DEFAULT_LOGOUT_REDIRECT

    this.pages = {
      logout: config.pages?.logout ?? { route: DEFAULT_LOGOUT_ROUTE, methods: ['POST'] },
      update: config.pages?.update ?? { route: DEFAULT_UPDATE_ROUTE, methods: ['POST'] },
      forgot: config.pages?.forgot ?? { route: DEFAULT_FORGOT_ROUTE, methods: ['POST'] },
      reset: config.pages?.reset ?? { route: DEFAULT_RESET_ROUTE, methods: ['POST'] },
    }

    this.callbacks = config.callbacks ?? {}

    this.routes = {
      login: new Map(),
      callback: new Map(),
    }

    this.providers.forEach((provider) => {
      provider
        .setJwtOptions(this.session.config.jwt)
        .setCookiesOptions(this.session.config.cookieOptions)

      this.routes.login.set(provider.config.pages.login.route, provider)
      this.routes.callback.set(provider.config.pages.callback.route, provider)
    })

    if (config.adapter == null) {
      return
    }

    if (Array.isArray(config.adapter)) {
      config.adapter.forEach((adapter) => adapter(this))
    } else {
      config.adapter(this)
    }
  }

  /**
   * Handle an incoming `InternalRequest`.
   */
  async handle(internalRequest: InternalRequest): Promise<InternalResponse> {
    const internalResponse = await this.generateInternalResponse(internalRequest).catch(
      (error) => ({ error }),
    )

    return internalResponse
  }

  /**
   * Generate an `InternalResponse` from an `InternalRequest`.
   */
  async generateInternalResponse(internalRequest: InternalRequest): Promise<InternalResponse> {
    const { url, request } = internalRequest

    /**
     * 1. Refresh the user's session if necessary and possible.
     */
    const sessionResponse = await this.session.handleRequest(internalRequest)

    /**
     * 2.1. Framework handles static auth pages.
     */
    if (
      url.pathname === this.pages.logout.route &&
      this.pages.logout.methods.includes(request.method)
    ) {
      return (await this.callbacks.logout?.(internalRequest)) ?? this.session.logout(request)
    }

    if (
      url.pathname === this.pages.update.route &&
      this.pages.update.methods.includes(request.method)
    ) {
      return (await this.callbacks.update?.(internalRequest)) ?? sessionResponse
    }

    if (
      url.pathname === this.pages.forgot.route &&
      this.pages.forgot.methods.includes(request.method)
    ) {
      return (await this.callbacks.forgot?.(internalRequest)) ?? sessionResponse
    }

    if (
      url.pathname === this.pages.reset.route &&
      this.pages.reset.methods.includes(request.method)
    ) {
      return (await this.callbacks.reset?.(internalRequest)) ?? sessionResponse
    }

    const loginHandler = this.routes.login.get(url.pathname)
    const callbackHandler = this.routes.callback.get(url.pathname)

    if (!loginHandler && !callbackHandler) {
      return sessionResponse
    }

    /**
     * 2.2. Providers handle login and callback pages.
     */
    const providerResponse =
      loginHandler && loginHandler.config.pages.login.methods.includes(request.method)
        ? await loginHandler.login(internalRequest)
        : callbackHandler && callbackHandler.config.pages.callback.methods.includes(request.method)
        ? await callbackHandler.callback(internalRequest)
        : {}

    /**
     * 3. The provider logged in a user if `user` is defined. Create a new session for the user.
     */
    if (providerResponse.session?.user) {
      const sessionTokens = (await this.session.config.createSession?.(
        providerResponse.session.user,
      )) ?? {
        accessToken: {
          expires: providerResponse.session.expires,
          user: providerResponse.session.user,
        },
        refreshToken: {
          expires: providerResponse.session.expires,
          user: providerResponse.session.user,
        },
      }

      if (sessionTokens?.accessToken) {
        providerResponse.session = sessionTokens.accessToken
      }

      if (sessionTokens) {
        providerResponse.cookies ??= []
        providerResponse.cookies.push(...(await this.session.createCookies(sessionTokens)))
      }
    }

    if (sessionResponse.cookies) {
      providerResponse.cookies ??= []
      providerResponse.cookies.push(...sessionResponse.cookies)
    }

    /**
     * User may be defined as a result of a provider login, or a session refresh.
     * Otherwise call `session.getUserFromRequest(request)` to get the user for the current request.
     */
    providerResponse.session ||= sessionResponse.session

    return providerResponse
  }
}

/**
 * Create an auth instance.
 */
export const createAuth = (config: AuthConfig) => new Auth(config)

/**
 * An adapter takes in an auth instance and modifies its behavior.
 */
export type Adapter = (auth: Auth) => Auth
