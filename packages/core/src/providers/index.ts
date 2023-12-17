import type * as oauth from 'oauth4webapi'

import type { Handle, Route } from '../types'
import type { Awaitable, Nullish } from '../utils/types'

export abstract class Provider {
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

export interface Endpoint<TContext = any, TResponse = any> {
  url: string
  params?: Record<string, any>
  request?: (context: TContext) => Awaitable<TResponse>
  conform?: (response: Response) => Awaitable<Response | Nullish>
}

export type TokenEndpointResponse =
  | oauth.OAuth2TokenEndpointResponse
  | oauth.OpenIDTokenEndpointResponse
