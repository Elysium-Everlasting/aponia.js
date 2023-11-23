import Cookies from 'universal-cookie'

import { Auth, type AuthConfig } from './middleware-auth'

export const cookieStore = new Cookies()

export class ClientAuth {
  auth: Auth

  constructor(config: AuthConfig) {
    this.auth = new Auth(config)
  }

  /**
   * Handle the client page load.
   */
  async handle() {
    const url = new URL(window.location.href)

    const request = new Request(url)

    const result = await this.auth.handle({ request, url, cookies: cookieStore.getAll() })

    console.log('handle result: ', result)

    result.cookies?.forEach((c) => {
      cookieStore.set(c.name, c.value, c.options)
    })

    if (result.user) {
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
