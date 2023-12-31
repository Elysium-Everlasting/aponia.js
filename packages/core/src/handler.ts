import type { Logger } from './logger'
import type { CreateCookiesOptions } from './security/cookie'
import type { Handle, Route } from './types'

/**
 * Custom implementation of middleware.
 *
 * @internal
 */
export abstract class Handler {
  /**
   * Routes the handler will handle.
   *
   * @example A Google provider might handle ['/auth/login/google', '/auth/callback/google']
   */
  public abstract routes: Route[]

  /**
   * When any of the routes match, this method will be called.
   *
   * The handler should differentiate between requested routes and return an appropriate response.
   */
  public abstract handle: Handle

  public abstract setCookiesOptions?: (options?: CreateCookiesOptions) => unknown

  public abstract setLogger?: (logger: Logger) => unknown
}

/**
 * Whether a {@link Aponia.Request} matches a {@link Route}.
 */
export function requestMatchesRoute(request: Aponia.Request, route: Route): boolean {
  return route.path === request.url.pathname && route.methods.includes(request.method)
}
