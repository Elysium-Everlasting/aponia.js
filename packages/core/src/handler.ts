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

/**
 * Whether a {@link Aponia.Request} matches a {@link Route}.
 */
export function requestMatchesRoute(request: Aponia.Request, route: Route): boolean {
  return route.path === request.url.pathname && route.methods.includes(request.method)
}
