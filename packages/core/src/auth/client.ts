import Cookies from 'universal-cookie'

import type { AnyProvider, InternalRequest } from '..'

import { MiddlewareAuth, type AuthConfig } from './middleware'

/**
 * TODO
 */
export class ClientAuth {
  auth: MiddlewareAuth

  constructor(config: AuthConfig) {
    this.auth = new MiddlewareAuth(config)
  }

  generateInternalRequest(cookies = new Cookies()): InternalRequest {
    const url = new URL(window.location.href)

    const request = new Request(url)

    if (url.hash) {
      new URLSearchParams(url.hash.slice(1)).forEach((value, key) => {
        url.searchParams.append(key, value)
      })
    }

    return {
      request,
      url,
      cookies: cookies.getAll(),
    }
  }

  /**
   * Handle the client page load.
   */
  async handle() {
    const cookies = new Cookies()

    const internalRequest = this.generateInternalRequest(cookies)

    const result = await this.auth.handle(internalRequest)

    result?.cookies?.forEach((c) => {
      cookies.set(c.name, c.value, c.options)
    })

    if (result?.session) {
      // TODO
    }

    if (result?.redirect) {
      window.location.href = result.redirect
      return
    }
  }

  /**
   * Given a provider, login.
   */
  async login(provider: AnyProvider) {
    // TODO: email and credentials login.
    if (provider.type === 'email' || provider.type === 'credentials') {
      return
    }

    // await provider.login()
  }
}
