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

export const ACTIONS = [
  'login',
  'register',
  'callback',
  'logout',
  'update',
  'forgot',
  'reset',
] as const

export type Action = (typeof ACTIONS)[number]

//----------------------------------------------------------------------------------------
// Logistical.
//----------------------------------------------------------------------------------------
export const ISSUER = 'aponia.js'
export const KEY_INFO = 'Auth.js Generated Encryption Key'
