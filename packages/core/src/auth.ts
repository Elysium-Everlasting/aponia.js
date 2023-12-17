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
import type { Route } from './types'

export interface AuthConfig {
  session?: SessionController
  providers?: Provider[]
  pages?: Partial<AuthPages>
  cookies?: CreateCookiesOptions
  callbacks?: Partial<AuthCallbacks>
  plugins?: Plugin[]
}

export interface AuthPages {
  logout: Route
  update: Route
  forgot: Route
  reset: Route
  logoutRedirect?: string
  fallback?: never
}

export type AuthCallbacks = {
  [k in keyof AuthPages]?: (request: Aponia.Request) => Promise<Aponia.Response>
}

export class Auth {
  pluginCoordinator: PluginCoordinator

  session: SessionController

  cookies?: CreateCookiesOptions

  pages: AuthPages

  providers: Provider[]

  routes: Map<string, { provider: Provider; route: Route }>

  callbacks?: Partial<AuthCallbacks>

  constructor(config: AuthConfig = {}) {
    this.pluginCoordinator = new PluginCoordinator()

    this.pages = {
      logout: config.pages?.logout ?? { path: DEFAULT_LOGOUT_ROUTE, methods: ['POST'] },
      update: config.pages?.update ?? { path: DEFAULT_UPDATE_ROUTE, methods: ['POST'] },
      forgot: config.pages?.forgot ?? { path: DEFAULT_FORGOT_ROUTE, methods: ['POST'] },
      reset: config.pages?.reset ?? { path: DEFAULT_RESET_ROUTE, methods: ['POST'] },
    }

    this.session = config.session ?? new SessionController()

    this.cookies = config.cookies

    this.providers = config.providers ?? []

    this.routes = new Map()

    this.providers.forEach((provider) => {
      provider.routes.forEach((endpoint) => {
        this.routes.set(endpoint.path, { provider, route: endpoint })
      })
    })

    this.callbacks = config.callbacks
  }

  public async handle(request: Aponia.Request): Promise<Aponia.Response | void> {
    const providerEndpoint = this.routes.get(request.url.pathname)

    if (providerEndpoint?.route != null && this.matches(request, providerEndpoint.route)) {
      return await providerEndpoint.provider.handle(request)
    }
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
   * Whether a {@link Aponia.Request} matches a {@link Route}.
   */
  private matches(request: Aponia.Request, pageEndpoint: Route): boolean {
    return (
      pageEndpoint.path === request.url.pathname && pageEndpoint.methods.includes(request.method)
    )
  }
}

export function createAuth(config: AuthConfig): Auth {
  return new Auth(config)
}
