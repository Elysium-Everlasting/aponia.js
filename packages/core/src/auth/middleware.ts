import type { OAuthConfig, OIDCConfig } from '@auth/core/providers'

import {
  DEFAULT_FORGOT_ROUTE,
  DEFAULT_LOGOUT_ROUTE,
  DEFAULT_RESET_ROUTE,
  DEFAULT_UPDATE_ROUTE,
} from '../constants'
import type { CredentialsProvider } from '../providers/credentials'
import type { EmailProvider } from '../providers/email'
import { OAuthProvider, resolveOAuthConfig } from '../providers/oauth.js'
import { OIDCProvider, resolveOIDCConfig } from '../providers/oidc.js'
import { SessionController, type SessionControllerUserConfig } from '../session/jwt'
import type { InternalRequest, InternalResponse, PageEndpoint } from '../types'
import type { Awaitable, Nullish } from '../utils/types'

export type AnyProvider = OAuthConfig<any> | OIDCConfig<any> | CredentialsProvider | EmailProvider

export type AnyResolvedOauthProvider = OAuthProvider<any> | OIDCProvider<any>

export type AnyResolvedProvider = AnyResolvedOauthProvider | CredentialsProvider | EmailProvider

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

export class MiddlewareAuth<T extends AnyResolvedProvider[] = AnyResolvedProvider[]> {
  session: SessionController
  providers: T
  pages: AuthPages
  callbacks: Partial<AuthCallbacks>
  routes: {
    register: Map<string, AnyResolvedProvider>
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
    }) as T

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
      register: new Map(),
    }

    this.providers.forEach((provider) => {
      provider
        .setJwtOptions(this.session.config.jwt)
        .setCookiesOptions(this.session.config.cookieOptions)

      this.routes.login.set(provider.config.pages.login.route, provider)
      this.routes.callback.set(provider.config.pages.callback.route, provider)

      if (provider.config.pages.register) {
        this.routes.register.set(provider.config.pages.register.route, provider)
      }
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

  public async handle(internalRequest: InternalRequest): Promise<InternalResponse | Nullish> {
    const loginHandler = this.routes.login.get(internalRequest.url.pathname)

    if (loginHandler && this.matches(internalRequest, loginHandler.config.pages.login)) {
      internalRequest.action = 'login'
      const providerResponse = await loginHandler.login(internalRequest)
      return await this.handleProviderResponse(providerResponse)
    }

    const callbackHandler = this.routes.callback.get(internalRequest.url.pathname)

    if (callbackHandler) {
      internalRequest.action = 'callback'
      const providerResponse = await callbackHandler.callback(internalRequest)
      return await this.handleProviderResponse(providerResponse)
    }

    if (this.matches(internalRequest, this.pages.logout)) {
      internalRequest.action = 'logout'
      return (
        (await this.callbacks.logout?.(internalRequest)) ??
        this.session.invalidateSession(internalRequest)
      )
    }

    if (this.matches(internalRequest, this.pages.update)) {
      internalRequest.action = 'update'
      return await this.callbacks.update?.(internalRequest)
    }

    if (this.matches(internalRequest, this.pages.forgot)) {
      internalRequest.action = 'forgot'
      return await this.callbacks.forgot?.(internalRequest)
    }

    if (this.matches(internalRequest, this.pages.reset)) {
      internalRequest.action = 'reset'
      return await this.callbacks.reset?.(internalRequest)
    }

    return await this.session.handleRequest(internalRequest)
  }

  private async handleProviderResponse(response: InternalResponse): Promise<InternalResponse> {
    if (response.session) {
      const sessionTokens = (await this.session.config.createSessionTokens?.(response.session)) ?? {
        accessToken: response.session,
        refreshToken: response.session,
      }
      response.cookies ??= []
      response.cookies.push(...(await this.session.createCookiesFromTokens(sessionTokens)))
    }

    return response
  }

  private matches(internalRequest: InternalRequest, pageEndpoint: PageEndpoint) {
    return (
      pageEndpoint.route === internalRequest.url.pathname &&
      pageEndpoint.methods.includes(internalRequest.request.method)
    )
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
