import type { CookieSerializeOptions } from 'cookie'

import {
  DEFAULT_COOKIE_NAME,
  DEFAULT_COOKIE_SERIALIZE_OPTIONS,
  DEFAULT_SECURE_PREFIX,
  FIFTEEN_MINUTES_IN_SECONDS,
} from '../constants'

export interface Cookie {
  name: string
  value: string
  options?: CookieSerializeOptions
}

export interface CookieOption {
  name: string
  options: CookieSerializeOptions
}

export interface CookiesOptions {
  accessToken: CookieOption
  refreshToken: CookieOption
  state: CookieOption
  nonce: CookieOption
  csrfToken: CookieOption
  pkceCodeVerifier: CookieOption
  callbackUrl: CookieOption
}

export type CreateCookiesOptions = {
  cookieName?: string
  securePrefix?: string
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

export const DEFAULT_COOKIES_OPTIONS = createCookiesOptions()
