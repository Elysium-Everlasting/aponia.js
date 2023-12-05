import {
  DEFAULT_FORGOT_ROUTE,
  DEFAULT_LOGOUT_ROUTE,
  DEFAULT_RESET_ROUTE,
  DEFAULT_UPDATE_ROUTE,
} from './constants'

export interface AuthConfig {
  pages?: Partial<AuthPages>
  callbacks?: Partial<AuthCallbacks>
  plugins?: any | any[]
}

export interface AuthPages {
  logout: PageEndpoint
  update: PageEndpoint
  forgot: PageEndpoint
  reset: PageEndpoint
  logoutRedirect?: string
}

export type AuthCallbacks = {
  [k in keyof AuthPages]?: (request: Aponia.Request) => Promise<Aponia.Response>
}

export interface PageEndpoint {
  route: string
  methods: string[]
  redirect?: string
}

export class Auth {
  callbacks?: Partial<AuthCallbacks>

  pages: AuthPages

  constructor(config: AuthConfig) {
    this.pages = {
      logout: config.pages?.logout ?? { route: DEFAULT_LOGOUT_ROUTE, methods: ['POST'] },
      update: config.pages?.update ?? { route: DEFAULT_UPDATE_ROUTE, methods: ['POST'] },
      forgot: config.pages?.forgot ?? { route: DEFAULT_FORGOT_ROUTE, methods: ['POST'] },
      reset: config.pages?.reset ?? { route: DEFAULT_RESET_ROUTE, methods: ['POST'] },
    }

    this.callbacks = config.callbacks
  }

  public async handle(request: Aponia.Request): Promise<Aponia.Response> {
    if (this.matches(request, this.pages.logout)) {
      request.action = 'logout'
      return (await this.callbacks?.logout?.(request)) ?? {} // this.session.invalidateSession(request)
    }

    if (this.matches(request, this.pages.update)) {
      request.action = 'update'
      return (await this.callbacks?.update?.(request)) ?? {}
    }

    if (this.matches(request, this.pages.forgot)) {
      request.action = 'forgot'
      return (await this.callbacks?.forgot?.(request)) ?? {}
    }

    if (this.matches(request, this.pages.reset)) {
      request.action = 'reset'
      return (await this.callbacks?.reset?.(request)) ?? {}
    }

    return {}
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
