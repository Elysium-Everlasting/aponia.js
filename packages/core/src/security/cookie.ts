import type { CookieSerializeOptions } from 'cookie'

import {
  ACCESS_TOKEN_NAME,
  CALLBACK_URL_NAME,
  CSRF_TOKEN_NAME,
  DEFAULT_COOKIE_NAME,
  DEFAULT_COOKIE_SERIALIZE_OPTIONS,
  DEFAULT_SECURE_PREFIX,
  FIFTEEN_MINUTES_IN_SECONDS,
  HOST_PREFIX,
  NONCE_NAME,
  PKCE_NAME,
  REFRESH_TOKEN_NAME,
  STATE_NAME,
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

export function getCookiePrefix(options?: CreateCookiesOptions): string {
  const cookieName = options?.cookieName ?? DEFAULT_COOKIE_NAME
  const securePrefix = options?.securePrefix ?? DEFAULT_SECURE_PREFIX

  return `${options?.serializationOptions?.secure ? securePrefix : ''}${cookieName}.`
}

export function createCookiesOptions(options?: CreateCookiesOptions): CookiesOptions {
  const secure = options?.serializationOptions?.secure
  const cookiePrefix = getCookiePrefix(options)

  return {
    accessToken: {
      name: `${cookiePrefix}.${ACCESS_TOKEN_NAME}`,
      options: {
        ...DEFAULT_COOKIE_SERIALIZE_OPTIONS,
        ...options?.serializationOptions,
      },
    },
    refreshToken: {
      name: `${cookiePrefix}.${REFRESH_TOKEN_NAME}`,
      options: {
        ...DEFAULT_COOKIE_SERIALIZE_OPTIONS,
        ...options?.serializationOptions,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}.${CALLBACK_URL_NAME}`,
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
      name: `${secure ? HOST_PREFIX : cookiePrefix}.${CSRF_TOKEN_NAME}`,
      options: {
        ...DEFAULT_COOKIE_SERIALIZE_OPTIONS,
        ...options?.serializationOptions,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}.${PKCE_NAME}`,
      options: {
        ...DEFAULT_COOKIE_SERIALIZE_OPTIONS,
        maxAge: FIFTEEN_MINUTES_IN_SECONDS,
        ...options?.serializationOptions,
      },
    },
    state: {
      name: `${cookiePrefix}.${STATE_NAME}`,
      options: {
        ...DEFAULT_COOKIE_SERIALIZE_OPTIONS,
        maxAge: FIFTEEN_MINUTES_IN_SECONDS,
        ...options?.serializationOptions,
      },
    },
    nonce: {
      name: `${cookiePrefix}.${NONCE_NAME}`,
      options: {
        ...DEFAULT_COOKIE_SERIALIZE_OPTIONS,
        maxAge: FIFTEEN_MINUTES_IN_SECONDS,
        ...options?.serializationOptions,
      },
    },
  }
}

export const DEFAULT_COOKIES_OPTIONS = createCookiesOptions()
