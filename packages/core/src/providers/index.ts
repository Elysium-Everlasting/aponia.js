import type { Awaitable } from '../utils/types'

/**
 */
export abstract class Provider {
  /**
   * A provider handles certain routes.
   *
   * @example A Google provider might handle ['/auth/login/google', '/auth/callback/google']
   */
  abstract routes(): string[]

  /**
   * Whenever a route is matched, the provider should handle the request.
   */
  abstract handle(request: Aponia.Request): Awaitable<Aponia.Response>
}
