import Cookies from 'universal-cookie'

import { Auth, type AuthConfig } from './middleware'

export class ClientAuth {
  auth: Auth

  constructor(config: AuthConfig) {
    this.auth = new Auth(config)
  }

  /**
   * Handle the client page load.
   */
  async handle() {
    const cookieStore = new Cookies()

    const url = new URL(window.location.href)

    const request = new Request(url)

    const result = await this.auth.handle({ request, url, cookies: cookieStore.getAll() })

    result.cookies?.forEach((c) => {
      cookieStore.set(c.name, c.value, c.options)
    })

    if (result.session) {
      // TODO
    }

    if (result.redirect) {
      window.location.href = result.redirect
      return
    }
  }

  /**
   * TODO
   */
  async login() {
    window.location.href = '/auth/login/google'
  }
}
