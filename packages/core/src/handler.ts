import type { Handle, Route } from './types'

export abstract class Handler {
  /**
   * A provider handles certain routes.
   *
   * @example A Google provider might handle ['/auth/login/google', '/auth/callback/google']
   */
  abstract routes: Route[]

  /**
   * Whenever a route is matched, the provider should handle the request.
   */
  abstract handle: Handle
}
