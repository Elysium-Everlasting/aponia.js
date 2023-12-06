/* eslint-disable @typescript-eslint/no-namespace */

import type { Action } from './constants'
import type { Cookie } from './security/cookie'

/**
 * The request object that the framework handles.
 */
export interface AponiaRequest {
  /**
   * The URL of the request.
   */
  url: URL

  /**
   * The HTTP method of the request.
   */
  method: string

  /**
   * Cookies sent with the request.
   */
  cookies: Record<string, string>

  /**
   * Relevant headers sent with the request.
   */
  headers: Headers

  /**
   * The desired auth action.
   */
  action: Action
}

/**
 * The response object generated by the framework.
 */
export interface AponiaResponse {
  /**
   * A provider may generate a {@link User} after the client authenticates.
   * It should be converted to a {@link Session}, saved by the client, and used on subsequent requests.
   */
  user?: AponiaUser

  /**
   * A {@link Session} may be generated by the framework after a {@link User} is defined by a previous step.
   */
  session?: AponiaSession

  /**
   * The HTTP status code of the response.
   */
  status?: number

  /**
   * The redirect URL of the response, if any.
   */
  redirect?: string

  /**
   * Cookies to be set in the response.
   */
  cookies?: Cookie[]

  /**
   * Any errors that occurred during the handling.
   *
   * TODO: custom auth pages for displaying errors.
   */
  error?: Error

  /**
   * The body of the response.
   *
   * TODO: custom auth pages for displaying payloads.
   */
  body?: unknown
}

/**
 * A unique user, should be used to create a {@link Session}.
 */
export interface AponiaUser {}

/**
 * A user's session, e.g. only relevant information needed to identify the user.
 */
export interface AponiaSession {}

export interface PageEndpoint {
  route: string
  methods: string[]
}

/**
 * A namespace in the global scope is also available for module augmentation
 *
 * The local interfaces are the source of truth, and the global interfaces are used by the framework.
 *
 * @see https://www.typescriptlang.org/docs/handbook/declaration-merging.html
 */
declare global {
  namespace Aponia {
    interface Request extends AponiaRequest {}

    interface Response extends AponiaResponse {}

    interface User extends AponiaUser {}

    interface Session extends AponiaSession {}
  }
}
