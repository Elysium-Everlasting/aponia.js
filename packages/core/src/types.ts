import type { Session } from '@auth/core/types'

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
   * The session.
   */
  session?: Session | null

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

/**
 * Data that's used to refresh an access token.
 *
 * @example Session ID: Look up the session in the database, extend the expiration data, create tokens.
 * @example User ID: Look up the user in the database, create new tokens with new expiration dates.
 * @example User: Just create new tokens with new expiration dates.
 */
export interface RefreshToken extends Session {}

/**
 * An auth page or endpoint that a provider manages.
 */
export interface PageEndpoint {
  /**
   * The route (url pathname) to the page.
   */
  route: string

  /**
   * The accepted HTTP methods for the page.
   */
  methods: string[]

  /**
   * The redirect url after visiting the page.
   */
  redirect?: string
}

/**
 * Pages handled by providers.
 */
export type ProviderPages = {
  /**
   * The provider's login page.
   */
  login: PageEndpoint

  /**
   * The provider's callback page. Mostly applicable for OAuth providers.
   */
  callback: PageEndpoint
}
