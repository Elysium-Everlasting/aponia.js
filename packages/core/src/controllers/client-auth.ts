import type { AnyProvider, AuthCallbacks, AuthConfig, AuthPages } from './middleware-auth'
import type { SessionManager } from './session'

export class ClientAuth {
  session: SessionManager

  providers: AnyProvider[]

  pages: AuthPages

  callbacks: Partial<AuthCallbacks>

  routes: {
    login: Map<string, AnyProvider>
    callback: Map<string, AnyProvider>
  }

  constructor(config: AuthConfig) {
    this.providers = config.providers

    this.session = config.session

    this.pages = {
      logout: config.pages?.logout ?? { route: '/auth/logout', methods: ['POST'] },
      update: config.pages?.update ?? { route: '/auth/update', methods: ['POST'] },
      forgot: config.pages?.forgot ?? { route: '/auth/forgot', methods: ['POST'] },
      reset: config.pages?.reset ?? { route: '/auth/reset', methods: ['POST'] },
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
  }

  /**
   * Client login.
   */
  login() {}
}
