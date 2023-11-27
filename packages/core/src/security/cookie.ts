import type { CookieSerializeOptions } from 'cookie'

import {
  DEFAULT_COOKIE_NAME,
  DEFAULT_COOKIE_SERIALIZE_OPTIONS,
  DEFAULT_SECURE_PREFIX,
  FIFTEEN_MINUTES_IN_SECONDS,
} from '../constants'

/**
 * Internal representation of a cookie before it's serialized.
 */
export interface Cookie {
  name: string
  value: string
  options?: CookieSerializeOptions
}

/**
 * This framework sets various cookies, each with a specific name and options.
 */
export interface CookieOption {
  name: string
  options: CookieSerializeOptions
}

export interface CookiesOptions {
  /**
   * Access token cookie stores the session information.
   */
  accessToken: CookieOption

  /**
   * Refresh token cookie stores information needed to refresh a user's session,
   * i.e. granting new access and refresh tokens.
   */
  refreshToken: CookieOption

  /**
   * State cokie stores a random string used to protect against CSRF attacks.
   */
  state: CookieOption

  /**
   * Nonce cookie stores a random string used to protect against replay attacks.
   */
  nonce: CookieOption

  /**
   * CSRF token cookie stores a random string used to protect against CSRF attacks.
   */
  csrfToken: CookieOption

  /**
   * PKCE code verifier cookie stores a random string used to protect against CSRF attacks.
   */
  pkceCodeVerifier: CookieOption

  /**
   * Callback URL cookie stores the URL to redirect to after a successful authentication.
   */
  callbackUrl: CookieOption
}

/**
 */
export type CreateCookiesOptions = {
  /**
   * The name of the cookie.
   *
   * @default 'aponia-auth'
   */
  cookieName?: string

  /**
   * Prefix for secure cookies.
   *
   * @default '__Secure-' for secure cookies, otherwise ''
   */
  securePrefix?: string

  /**
   * General serialization options for all auth-related cookies.
   */
  serializationOptions?: CookieSerializeOptions
}

export function createCookiesOptions(options?: CreateCookiesOptions): CookiesOptions {
  const secure = options?.serializationOptions?.secure

  const cookieName = options?.cookieName ?? DEFAULT_COOKIE_NAME
  const securePrefix = options?.securePrefix ?? DEFAULT_SECURE_PREFIX
  const cookiePrefix = secure ? securePrefix : ''

  return {
    accessToken: {
      name: `${cookiePrefix}${cookieName}.access-token`,
      options: {
        ...DEFAULT_COOKIE_SERIALIZE_OPTIONS,
        ...options?.serializationOptions,
      },
    },
    refreshToken: {
      name: `${cookiePrefix}${cookieName}.refresh-token`,
      options: {
        ...DEFAULT_COOKIE_SERIALIZE_OPTIONS,
        ...options?.serializationOptions,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}${cookieName}.callback-url`,
      options: {
        ...DEFAULT_COOKIE_SERIALIZE_OPTIONS,
        ...options?.serializationOptions,
      },
    },
    csrfToken: {
      /**
       * Default to __Host- for CSRF token for additional protection if using secure cookies.
       * NB: The `__Host-` prefix is stricter than the `__Secure-` prefix.
       */
      name: `${secure ? '__Host-' : cookiePrefix}${cookieName}.csrf-token`,
      options: {
        ...DEFAULT_COOKIE_SERIALIZE_OPTIONS,
        ...options?.serializationOptions,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}${cookieName}.pkce.code_verifier`,
      options: {
        ...DEFAULT_COOKIE_SERIALIZE_OPTIONS,
        maxAge: FIFTEEN_MINUTES_IN_SECONDS,
        ...options?.serializationOptions,
      },
    },
    state: {
      name: `${cookiePrefix}${cookieName}.state`,
      options: {
        ...DEFAULT_COOKIE_SERIALIZE_OPTIONS,
        maxAge: FIFTEEN_MINUTES_IN_SECONDS,
        ...options?.serializationOptions,
      },
    },
    nonce: {
      name: `${cookiePrefix}${cookieName}.nonce`,
      options: {
        ...DEFAULT_COOKIE_SERIALIZE_OPTIONS,
        maxAge: FIFTEEN_MINUTES_IN_SECONDS,
        ...options?.serializationOptions,
      },
    },
  }
}

export const defaultCookiesOptions = createCookiesOptions()
