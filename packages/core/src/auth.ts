import { SessionController } from './controllers/session'
import type { Handler } from './handler'
import type { CreateCookiesOptions } from './security/cookie'
import type { Route } from './types'

export interface AuthConfig {
  session?: SessionController
  providers?: Handler[]
  cookies?: CreateCookiesOptions
}

export class Auth {
  cookies?: CreateCookiesOptions

  session: SessionController

  handlers: Handler[]

  routes: Map<string, { handler: Handler; route: Route }>

  constructor(config: AuthConfig = {}) {
    this.session = config.session ?? new SessionController()
    this.session.setCookieOptions(config.cookies)

    this.cookies = config.cookies

    this.handlers = config.providers ?? []

    this.routes = new Map()

    this.handlers.forEach((provider) => {
      provider.routes.forEach((endpoint) => {
        this.routes.set(endpoint.path, { handler: provider, route: endpoint })
      })
    })
  }

  public async handle(request: Aponia.Request): Promise<Aponia.Response | void> {
    const providerEndpoint = this.routes.get(request.url.pathname)

    if (providerEndpoint?.route != null && this.matches(request, providerEndpoint.route)) {
      return await providerEndpoint.handler.handle(request)
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
