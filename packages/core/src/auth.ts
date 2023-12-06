import {
  DEFAULT_FORGOT_ROUTE,
  DEFAULT_LOGOUT_ROUTE,
  DEFAULT_RESET_ROUTE,
  DEFAULT_UPDATE_ROUTE,
} from './constants'
import type { Provider } from './providers'
import type { CreateCookiesOptions } from './security/cookie'
import type { SessionController, Tokens } from './session-controller'
import { JsonSessionController } from './session-controller/json'

export interface AuthConfig {
  transport?: Transport
  session?: SessionController
  providers?: Provider[]
  pages?: Partial<AuthPages>
  cookies?: CreateCookiesOptions
  callbacks?: Partial<AuthCallbacks>
  plugins?: any | any[]
}

export interface AuthPages {
  logout: PageEndpoint
  update: PageEndpoint
  forgot: PageEndpoint
  reset: PageEndpoint
  logoutRedirect?: string
  fallback?: never
}

export type AuthCallbacks = {
  [k in keyof AuthPages]?: (request: Aponia.Request) => Promise<Aponia.Response>
}

export interface PageEndpoint {
  route: string
  methods: string[]
  redirect?: string
}

export type Transport = 'cookie' | 'header'

export class Auth {
  transport: Transport

  session: SessionController

  callbacks?: Partial<AuthCallbacks>

  pages: AuthPages

  providers: Provider[]

  providerHandlers: Map<string, Provider>

  constructor(config: AuthConfig) {
    this.pages = {
      logout: config.pages?.logout ?? { route: DEFAULT_LOGOUT_ROUTE, methods: ['POST'] },
      update: config.pages?.update ?? { route: DEFAULT_UPDATE_ROUTE, methods: ['POST'] },
      forgot: config.pages?.forgot ?? { route: DEFAULT_FORGOT_ROUTE, methods: ['POST'] },
      reset: config.pages?.reset ?? { route: DEFAULT_RESET_ROUTE, methods: ['POST'] },
    }

    this.callbacks = config.callbacks

    this.session = config.session ?? new JsonSessionController()

    this.transport = config.transport ?? 'cookie'

    this.providers = config.providers ?? []

    this.providerHandlers = new Map()

    this.providers.forEach((provider) => {
      provider.setCookiesOptions(config.cookies)

      provider.routes.forEach((route) => {
        this.providerHandlers.set(route, provider)
      })
    })
  }

  public async handle(request: Aponia.Request): Promise<Aponia.Response> {
    const providerResponse = await this.handleProviderRequest(request)

    if (providerResponse) {
      return await this.handleResponseSession(request, providerResponse)
    }

    const staticResponse = await this.handleStaticRequest(request)

    if (staticResponse) {
      return await this.handleResponseSession(request, staticResponse)
    }

    return (await this.callbacks?.fallback?.(request)) ?? {}
  }

  public async handleProviderRequest(request: Aponia.Request): Promise<Aponia.Response | void> {
    if (this.providerHandlers.has(request.url.pathname)) {
      return await this.providerHandlers.get(request.url.pathname)?.handle(request)
    }
  }

  public async handleStaticRequest(request: Aponia.Request): Promise<Aponia.Response | undefined> {
    if (this.matches(request, this.pages.logout)) {
      request.action = 'logout'
      return await this.callbacks?.logout?.(request)
    }

    if (this.matches(request, this.pages.update)) {
      request.action = 'update'
      return await this.callbacks?.update?.(request)
    }

    if (this.matches(request, this.pages.forgot)) {
      request.action = 'forgot'
      return await this.callbacks?.forgot?.(request)
    }

    if (this.matches(request, this.pages.reset)) {
      request.action = 'reset'
      return await this.callbacks?.reset?.(request)
    }

    return
  }

  public async handleResponseSession(
    request: Aponia.Request,
    response: Aponia.Response,
  ): Promise<Aponia.Response> {
    if (response.session == null && response.user != null) {
      response.session = await this.session.createSessionFromUser(response.user)
    }

    if (response.session != null) {
      const tokens = await this.session.createTokensFromSession(response.session)

      if (tokens) {
        await this.addTokensToResponse(request, response, tokens)
      }
    }

    return response
  }

  public async getTokensFromRequest(request: Aponia.Request): Promise<Tokens> {
    if (this.transport === 'cookie') {
      return {
        accessToken: await request.cookies.get('access-token'),
        refreshToken: await request.cookies.get('refresh-token'),
      }
    }

    return {
      accessToken: request.headers.get('Authorization')?.split(' ')[1],
    }
  }

  public async addTokensToResponse(
    request: Aponia.Request,
    response: Aponia.Response,
    tokens: Tokens,
  ): Promise<void> {
    if (tokens.accessToken == null && tokens.refreshToken == null) {
      return
    }

    switch (this.transport) {
      case 'cookie': {
        response.cookies ??= request.cookies

        if (tokens.accessToken) {
          await response.cookies.set('access-token', tokens.accessToken, {
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
          })
        }
        break
      }
    }
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

export function createAuth(config: AuthConfig): Auth {
  return new Auth(config)
}
