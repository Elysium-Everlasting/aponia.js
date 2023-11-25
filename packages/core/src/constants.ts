//----------------------------------------------------------------------------------------
// Pages.
//----------------------------------------------------------------------------------------

import type { CookieSerializeOptions } from 'cookie'

/**
 * The default page to redirect to after logging out.
 */
export const DEFAULT_LOGOUT_REDIRECT = '/auth/login'

/**
 */
export const DEFAULT_LOGOUT_ROUTE = '/auth/logout'

/**
 */
export const DEFAULT_UPDATE_ROUTE = '/auth/update'

/**
 */
export const DEFAULT_FORGOT_ROUTE = '/auth/forgot'

/**
 */
export const DEFAULT_RESET_ROUTE = '/auth/reset'

/**
 * A partial route.
 * This exact route could be handled by the framework by displaying all providers.
 * Specific provider login routes would look like `/auth/login/:providerId`.
 *
 * @example '/auth/login/google'
 */
export const DEFAULT_LOGIN_ROUTE = '/auth/login'

/**
 * A partial route.
 * This exact route could be handled by the framework by displaying all providers.
 * Specific provider callback routes would look like `/auth/callback/:providerId`.
 *
 * @example '/auth/register/google'
 */
export const DEFAULT_REGISTER_ROUTE = '/auth/register'

/**
 * A partial route.
 * This route ___WILL NOT___ be handled by the framework, since it is specific to a provider.
 * Specific provider callback routes would look like `/auth/callback/:providerId`.
 *
 * @example '/auth/callback/google'
 */
export const DEFAULT_CALLBACK_ROUTE = '/auth/callback'

/**
 * Where to redirect the user after logging in.
 */
export const DEFAULT_CALLBACK_REDIRECT = '/'

//----------------------------------------------------------------------------------------
// Miscellaneous.
//----------------------------------------------------------------------------------------
export const FIFTEEN_MINUTES_IN_SECONDS = 60 * 15

export const HOUR_IN_SECONDS = 4 * FIFTEEN_MINUTES_IN_SECONDS

export const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS

export const WEEK_IN_SECONDS = 7 * DAY_IN_SECONDS

//----------------------------------------------------------------------------------------
// Logistical.
//----------------------------------------------------------------------------------------

/**
 * Issuer used for the authorization server.
 */
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
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
}
