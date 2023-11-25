import type { CookieSerializeOptions } from 'cookie'

const defaultCookieName = 'aponia-auth'

const defaultSecurePrefix = '__Secure-'

const fifteenMinutesInSeconds = 60 * 15

const defaultSerializationOptions: CookieSerializeOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
}

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

  const cookieName = options?.cookieName ?? defaultCookieName
  const securePrefix = options?.securePrefix ?? defaultSecurePrefix
  const cookiePrefix = secure ? securePrefix : ''

  return {
    accessToken: {
      name: `${cookiePrefix}${cookieName}.access-token`,
      options: {
        ...defaultSerializationOptions,
        ...options?.serializationOptions,
      },
    },
    refreshToken: {
      name: `${cookiePrefix}${cookieName}.refresh-token`,
      options: {
        ...defaultSerializationOptions,
        ...options?.serializationOptions,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}${cookieName}.callback-url`,
      options: {
        ...defaultSerializationOptions,
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
        ...defaultSerializationOptions,
        ...options?.serializationOptions,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}${cookieName}.pkce.code_verifier`,
      options: {
        ...defaultSerializationOptions,
        maxAge: fifteenMinutesInSeconds,
        ...options?.serializationOptions,
      },
    },
    state: {
      name: `${cookiePrefix}${cookieName}.state`,
      options: {
        ...defaultSerializationOptions,
        maxAge: fifteenMinutesInSeconds,
        ...options?.serializationOptions,
      },
    },
    nonce: {
      name: `${cookiePrefix}${cookieName}.nonce`,
      options: {
        ...defaultSerializationOptions,
        maxAge: fifteenMinutesInSeconds,
        ...options?.serializationOptions,
      },
    },
  }
}

export const defaultCookiesOptions = createCookiesOptions()
