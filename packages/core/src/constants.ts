import type { CookieSerializeOptions } from 'cookie'

//----------------------------------------------------------------------------------------
// Pages.
//----------------------------------------------------------------------------------------
export const DEFAULT_LOGOUT_REDIRECT = '/auth/login'
export const DEFAULT_LOGOUT_ROUTE = '/auth/logout'
export const DEFAULT_UPDATE_ROUTE = '/auth/update'
export const DEFAULT_FORGOT_ROUTE = '/auth/forgot'
export const DEFAULT_RESET_ROUTE = '/auth/reset'
export const DEFAULT_LOGIN_ROUTE = '/auth/login'
export const DEFAULT_REGISTER_ROUTE = '/auth/register'
export const DEFAULT_CALLBACK_ROUTE = '/auth/callback'
export const DEFAULT_CALLBACK_REDIRECT = '/'

//----------------------------------------------------------------------------------------
// Miscellaneous.
//----------------------------------------------------------------------------------------
export const FIFTEEN_MINUTES_IN_SECONDS = 60 * 15
export const HOUR_IN_SECONDS = 4 * FIFTEEN_MINUTES_IN_SECONDS
export const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS
export const WEEK_IN_SECONDS = 7 * DAY_IN_SECONDS
export const IS_BROWSER = typeof window !== 'undefined'

//----------------------------------------------------------------------------------------
// Logistical.
//----------------------------------------------------------------------------------------
export const ISSUER = 'aponia.js'
export const KEY_INFO = 'Auth.js Generated Encryption Key'

//----------------------------------------------------------------------------------------
// Security.
//----------------------------------------------------------------------------------------
export const SALT = ''
export const DEFAULT_SECRET = 'secret'
export const DEFAULT_ACCESS_TOKEN_AGE = HOUR_IN_SECONDS
export const DEFAULT_REFRESH_TOKEN_AGE = WEEK_IN_SECONDS
export const DEFAULT_CHECKS = ['pkce']
export const PKCE_MAX_AGE = FIFTEEN_MINUTES_IN_SECONDS
export const STATE_MAX_AGE = FIFTEEN_MINUTES_IN_SECONDS
export const NONCE_MAX_AGE = FIFTEEN_MINUTES_IN_SECONDS
export const DEFAULT_COOKIE_NAME = 'aponia-auth'
export const DEFAULT_SECURE_PREFIX = '__Secure-'
export const DEFAULT_COOKIE_SERIALIZE_OPTIONS: CookieSerializeOptions = {
  httpOnly: !IS_BROWSER,
  sameSite: 'lax',
  path: '/',
}
export const DEFAULT_RESPONSE_TYPE = 'code'

export const ACCESS_TOKEN_NAME = 'access-token'
export const REFRESH_TOKEN_NAME = 'refresh-token'
export const CALLBACK_URL_NAME = 'callback-url'
export const CSRF_TOKEN_NAME = 'csrf-token'
export const PKCE_NAME = 'pkce.code-verifier'
export const STATE_NAME = 'state'
export const NONCE_NAME = 'nonce'
export const HOST_PREFIX = '__Host-'
