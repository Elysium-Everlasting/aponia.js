import type { User } from '@auth/core/types'

import type { Cookie } from './security/cookie'

/**
 * Request object used internally.
 */
export interface InternalRequest {
  /**
   * The original request.
   */
  request: Request

  /**
   * The request's parsed url.
   */
  url: URL

  /**
   * The request's cookies.
   */
  cookies: Record<string, string>
}

/**
 * An internally generated response.
 *
 * Should be handled accordingly depending on the context of the usage.
 */
export interface InternalResponse {
  /**
   * The decoded user.
   */
  user?: User | null

  /**
   * HTTP status code.
   */
  status?: number

  /**
   * The response redirect url.
   */
  redirect?: string

  /**
   * Cookies to set. Represented in an internal, unserialized format.
   */
  cookies?: Cookie[]

  /**
   * Any error that occurred.
   */
  error?: Error

  /**
   * Response body.
   */
  body?: unknown
}
