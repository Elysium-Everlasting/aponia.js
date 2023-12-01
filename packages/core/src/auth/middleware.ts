import type { OAuthConfig, OIDCConfig } from '@auth/core/providers'

import {
  DEFAULT_FORGOT_ROUTE,
  DEFAULT_LOGOUT_ROUTE,
  DEFAULT_RESET_ROUTE,
  DEFAULT_UPDATE_ROUTE,
} from '../constants'
import { SessionController, type SessionControllerUserConfig } from '../controllers/session'
import type { CredentialsProvider } from '../providers/credentials'
import type { EmailProvider } from '../providers/email'
import { OAuthProvider, resolveOAuthConfig } from '../providers/oauth.js'
import { OIDCProvider, resolveOIDCConfig } from '../providers/oidc.js'
import type { InternalRequest, InternalResponse, PageEndpoint } from '../types'
import type { Awaitable, Nullish } from '../utils/types'

export type AnyProvider = OAuthConfig<any> | OIDCConfig<any> | CredentialsProvider | EmailProvider

export type AnyResolvedProvider =
  | OAuthProvider<any>
  | OIDCProvider<any>
  | CredentialsProvider
  | EmailProvider

export interface AuthPages {
  logout: PageEndpoint
  update: PageEndpoint
  forgot: PageEndpoint
  reset: PageEndpoint
  logoutRedirect?: string
}

export type AuthCallbacks = {
  [k in keyof AuthPages]?: (request: InternalRequest) => Awaitable<InternalResponse | Nullish>
}

export interface AuthConfig {
  adapter?: MiddlwareAuthAdapter | MiddlwareAuthAdapter[]
  session: SessionController | SessionControllerUserConfig
  providers: AnyProvider[]
  pages?: Partial<AuthPages>
  callbacks?: Partial<AuthCallbacks>
}

export class MiddlewareAuth {
  session: SessionController
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
      config.session instanceof SessionController
        ? config.session
        : new SessionController(config.session)

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

  async handle(internalRequest: InternalRequest): Promise<InternalResponse | Nullish> {
    const internalResponse = await this.generateInternalResponse(internalRequest).catch(
      (error) => ({ error }),
    )

    return internalResponse
  }

  matches(internalRequest: InternalRequest, pageEndpoint: PageEndpoint) {
    return (
      internalRequest.url.pathname === pageEndpoint.route &&
      this.pages.logout.methods.includes(internalRequest.request.method)
    )
  }

  async generateInternalResponse(
    internalRequest: InternalRequest,
  ): Promise<InternalResponse | Nullish> {
    const sessionResponse = await this.session.handleRequest(internalRequest)

    if (this.matches(internalRequest, this.pages.logout)) {
      return (
        (await this.callbacks.logout?.(internalRequest)) ?? this.session.logout(internalRequest)
      )
    }

    if (this.matches(internalRequest, this.pages.update)) {
      return (await this.callbacks.update?.(internalRequest)) ?? sessionResponse
    }

    if (this.matches(internalRequest, this.pages.forgot)) {
      return (await this.callbacks.forgot?.(internalRequest)) ?? sessionResponse
    }

    if (this.matches(internalRequest, this.pages.reset)) {
      return (await this.callbacks.reset?.(internalRequest)) ?? sessionResponse
    }

    const loginHandler = this.routes.login.get(internalRequest.url.pathname)
    const callbackHandler = this.routes.callback.get(internalRequest.url.pathname)

    if (loginHandler == null && callbackHandler == null) {
      return sessionResponse
    }

    const providerResponse =
      loginHandler && this.matches(internalRequest, loginHandler.config.pages.login)
        ? await loginHandler.login(internalRequest)
        : callbackHandler && this.matches(internalRequest, callbackHandler.config.pages.callback)
        ? await callbackHandler.callback(internalRequest)
        : {}

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
        providerResponse.cookies.push(
          ...(await this.session.createCookiesFromTokens(sessionTokens)),
        )
      }
    }

    if (sessionResponse?.cookies) {
      providerResponse.cookies ??= []
      providerResponse.cookies.push(...sessionResponse.cookies)
    }

    if (sessionResponse?.session) {
      providerResponse.session = sessionResponse?.session
    }

    return providerResponse
  }
}

/**
 * Create an auth instance.
 */
export const createMiddlewareAuth = (config: AuthConfig) => new MiddlewareAuth(config)

/**
 * An adapter takes in an auth instance and modifies its behavior.
 */
export type MiddlwareAuthAdapter = (auth: MiddlewareAuth) => MiddlewareAuth
