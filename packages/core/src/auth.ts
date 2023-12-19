import { SessionController } from './controllers/session'
import { requestMatchesRoute, type Handler } from './handler'
import type { CreateCookiesOptions } from './security/cookie'
import type { Route } from './types'

export interface AuthConfig {
  session?: SessionController
  handlers?: Handler[]
  cookies?: CreateCookiesOptions
}

export interface InternalRoute {
  handler: Handler
  route: Route
}

export class Auth {
  cookies?: CreateCookiesOptions

  session: SessionController

  handlers: Handler[]

  routes: Map<string, InternalRoute>

  constructor(config: AuthConfig = {}) {
    this.cookies = config.cookies

    this.session = config.session ?? new SessionController()
    this.session.setCookieOptions(this.cookies)

    this.handlers = config.handlers ?? []

    this.routes = new Map()

    this.handlers.forEach((handler) => {
      handler.routes.forEach((route) => {
        this.routes.set(route.path, { handler, route })
      })
    })
  }

  public async handle(request: Aponia.Request): Promise<Aponia.Response> {
    const route = this.routes.get(request.url.pathname)

    if (route?.route != null && requestMatchesRoute(request, route.route)) {
      const response = await route.handler.handle(request)

      if (response == null) {
        return {}
      }

      try {
        return this.handleResponseSession(response)
      } catch (error: any) {
        return { error }
      }
    }

    return {}
  }

  public async handleResponseSession(response: Aponia.Response): Promise<Aponia.Response> {
    if (response.session == null && response.user != null) {
      try {
        response.session = await this.session.createSessionFromUser(response.user)
      } catch {
        /* noop */
      }
    }

    if (response.session != null) {
      try {
        const cookies = await this.session.createCookiesFromSession(response.session)
        response.cookies ??= []
        response.cookies.push(...cookies)
      } catch {
        /* noop */
      }
    }

    return response
  }
}

export function createAuth(config: AuthConfig): Auth {
  return new Auth(config)
}
