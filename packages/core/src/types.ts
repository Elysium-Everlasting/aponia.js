/* eslint-disable @typescript-eslint/no-namespace */

import type { Cookie } from './security/cookie'

export type AuthenticatedKeys =
  | 'account'
  | 'providerAccountMapping'
  | 'providerType'
  | 'providerId'
  | 'providerAccountId'

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
}

export interface AponiaAuthenticatedResponse
  extends Omit<AponiaResponse, AuthenticatedKeys>,
    Required<Pick<AponiaResponse, AuthenticatedKeys>> {}

/**
 * The response object generated by the framework.
 */
export interface AponiaResponse {
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

  /**
   * A provider may generate a {@link User} after the client authenticates.
   * It should be converted to a {@link Session}, saved by the client, and used on subsequent requests.
   */
  account?: AponiaAccount

  /**
   */
  providerAccountMapping?: AponiaProviderAccountMapping

  /**
   * The type of provider that generated this response (if any).
   */
  providerType?: string

  /**
   * The ID of the provider that generated this response (if any).
   */
  providerId?: string

  /**
   * The ID of the account from the provider's platform.
   */
  providerAccountId?: string
}

/**
 * A unique user, should be used to create a {@link Session}.
 */
export interface AponiaUser {}

/**
 */
export interface AponiaAccount {}

/**
 */
export interface AponiaProviderAccount {}

/**
 */
export interface AponiaProviderAccountMapping {}

/**
 * A user's session, e.g. only relevant information needed to identify the user.
 */
export interface AponiaSession {}

/**
 */
export interface AponiaRefresh {}

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

    interface Response extends Omit<AponiaResponse, 'account' | 'providerAccountMapping'> {
      account?: Aponia.ProviderAccount
      providerAccountMapping?: Aponia.ProviderAccountMapping
    }

    interface AuthenticatedResponse
      extends Omit<Aponia.Response, AuthenticatedKeys>,
        Required<Pick<Aponia.Response, AuthenticatedKeys>> {}

    interface ProviderAccount extends AponiaProviderAccount {}

    interface ProviderAccountMapping extends AponiaProviderAccountMapping {}

    interface User extends AponiaUser {}

    interface Account extends AponiaAccount {}

    interface Session extends AponiaSession {}

    interface Refresh extends AponiaRefresh {}
  }
}
