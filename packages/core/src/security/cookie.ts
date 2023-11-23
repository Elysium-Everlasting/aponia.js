import type { CookieSerializeOptions } from 'cookie'

const defaultCookieName = 'aponia-auth'

const defaultSecurePrefix = '__Secure-'

const fifteenMinutesInSeconds = 60 * 15

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
  useSecureCookies?: boolean
  globalOverrides?: CookieSerializeOptions
  cookieName?: string
  securePrefix?: string
}

export function createCookiesOptions(options?: CreateCookiesOptions): CookiesOptions {
  const useSecureCookies = options?.useSecureCookies ?? false
  const globalOverrides = options?.globalOverrides
  const cookieName = options?.cookieName ?? defaultCookieName
  const securePrefix = options?.securePrefix ?? defaultSecurePrefix
  const cookiePrefix = useSecureCookies ? securePrefix : ''
  return {
    accessToken: {
      name: `${cookiePrefix}${cookieName}.access-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        ...globalOverrides,
      },
    },
    refreshToken: {
      name: `${cookiePrefix}${cookieName}.refresh-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        ...globalOverrides,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}${cookieName}.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        ...globalOverrides,
      },
    },
    csrfToken: {
      /**
       * Default to __Host- for CSRF token for additional protection if using secure cookies.
       * NB: The `__Host-` prefix is stricter than the `__Secure-` prefix.
       */
      name: `${useSecureCookies ? '__Host-' : cookiePrefix}${cookieName}.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        ...globalOverrides,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}${cookieName}.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        maxAge: fifteenMinutesInSeconds,
        ...globalOverrides,
      },
    },
    state: {
      name: `${cookiePrefix}${cookieName}.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        maxAge: fifteenMinutesInSeconds,
        ...globalOverrides,
      },
    },
    nonce: {
      name: `${cookiePrefix}${cookieName}.nonce`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        maxAge: fifteenMinutesInSeconds,
        ...globalOverrides,
      },
    },
  }
}
