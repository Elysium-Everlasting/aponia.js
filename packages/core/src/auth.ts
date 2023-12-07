import {
  DEFAULT_FORGOT_ROUTE,
  DEFAULT_LOGOUT_ROUTE,
  DEFAULT_RESET_ROUTE,
  DEFAULT_UPDATE_ROUTE,
} from './constants'
import { SessionController } from './controllers/session'
import { PluginCoordinator, type Plugin } from './plugin'
import type { Provider } from './providers'
import type { CreateCookiesOptions } from './security/cookie'
import type { PageEndpoint } from './types'

export interface AuthConfig {
  session?: SessionController
  providers?: Provider[]
  pages?: Partial<AuthPages>
  cookies?: CreateCookiesOptions
  callbacks?: Partial<AuthCallbacks>
  plugins?: Plugin[]
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

export class Auth {
  pluginCoordinator: PluginCoordinator

  plugins: Plugin[]

  session: SessionController

  cookies?: CreateCookiesOptions

  pages: AuthPages

  providers: Provider[]

  providerEndpoints: Map<string, { provider: Provider; endpoint: PageEndpoint }>

  callbacks?: Partial<AuthCallbacks>

  constructor(config: AuthConfig = {}) {
    this.pluginCoordinator = new PluginCoordinator()

    this.pages = {
      logout: config.pages?.logout ?? { route: DEFAULT_LOGOUT_ROUTE, methods: ['POST'] },
      update: config.pages?.update ?? { route: DEFAULT_UPDATE_ROUTE, methods: ['POST'] },
      forgot: config.pages?.forgot ?? { route: DEFAULT_FORGOT_ROUTE, methods: ['POST'] },
      reset: config.pages?.reset ?? { route: DEFAULT_RESET_ROUTE, methods: ['POST'] },
    }

    this.session = config.session ?? new SessionController()

    this.cookies = config.cookies

    this.providers = config.providers ?? []

    this.providerEndpoints = new Map()

    this.providers.forEach((provider) => {
      provider.initialize?.(this.pluginCoordinator)

      provider.managedEndpoints.forEach((endpoint) => {
        this.providerEndpoints.set(endpoint.route, { provider, endpoint })
      })
    })

    this.callbacks = config.callbacks

    this.plugins = config.plugins ?? []

    this.plugins.forEach((plugin) => {
      plugin.setup?.(this.pluginCoordinator)
    })

    if (this.cookies) {
      this.pluginCoordinator.emit('cookies', this.cookies)
    }
  }

  public async handle(request: Aponia.Request): Promise<Aponia.Response> {
    const providerResponse = await this.handleProviderRequest(request)

    if (providerResponse) {
      return await this.handleResponseSession(providerResponse)
    }

    const staticResponse = await this.handleStaticRequest(request)

    if (staticResponse) {
      return await this.handleResponseSession(staticResponse)
    }

    return (await this.callbacks?.fallback?.(request)) ?? {}
  }

  public async handleProviderRequest(request: Aponia.Request): Promise<Aponia.Response | void> {
    const providerEndpoint = this.providerEndpoints.get(request.url.pathname)

    if (providerEndpoint?.endpoint != null && this.matches(request, providerEndpoint.endpoint)) {
      return await providerEndpoint.provider.handle(request)
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

  public async handleResponseSession(response: Aponia.Response): Promise<Aponia.Response> {
    if (response.session == null && response.user != null) {
      response.session = await this.session.createSessionFromUser(response.user)
    }

    if (response.session != null) {
      const cookies = await this.session.createCookiesFromSession(response.session)
      response.cookies ??= []
      response.cookies.push(...cookies)
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

export function createAuth(config: AuthConfig): Auth {
  return new Auth(config)
}
