import type * as oauth from 'oauth4webapi'

import type { PageEndpoint } from '../types'
import type { Awaitable, Nullish } from '../utils/types'

/**
 */
export abstract class Provider {
  /**
   * A provider handles certain routes.
   *
   * @example A Google provider might handle ['/auth/login/google', '/auth/callback/google']
   */
  abstract managedEndpoints: PageEndpoint[]

  /**
   * Whenever a route is matched, the provider should handle the request.
   */
  abstract handle(request: Aponia.Request): Awaitable<Aponia.Response | void>
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
