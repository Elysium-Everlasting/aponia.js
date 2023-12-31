/**
 * @see https://github.com/jshttp/cookie
 */

import { DEFAULT_COOKIE_NAME, DEFAULT_SECURE_PREFIX } from '../constants'

export interface Cookie {
  name: string
  value: string
  options?: CookieSerializeOptions
}

export type CookiePriority = 'low' | 'medium' | 'high'

export type CookieSameSite = true | false | 'lax' | 'strict' | 'none'

export interface CookieSerializeOptions {
  domain?: string
  encode?: (value: string) => string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  priority?: CookiePriority
  sameSite?: CookieSameSite
  secure?: boolean
  partitioned?: boolean
}

/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */
// eslint-disable-next-line no-control-regex
export const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/

export function serializeCookie(
  name: string,
  value: string,
  options: CookieSerializeOptions = {},
): string {
  if (!fieldContentRegExp.test(name)) {
    throw new TypeError('argument name is invalid')
  }

  const encode = options.encode ?? encodeURIComponent

  const encodedValue = encode(value)

  if (encodedValue && !fieldContentRegExp.test(encodedValue)) {
    throw new TypeError('argument value is invalid')
  }

  let cookieString = `${name}=${encodedValue}`

  if (options.maxAge != null) {
    if (!isFinite(options.maxAge)) {
      throw new TypeError('option maxAge is invalid')
    }
    cookieString += `; Max-Age=${Math.floor(options.maxAge)}`
  }

  if (options.domain) {
    if (!fieldContentRegExp.test(options.domain)) {
      throw new TypeError('option domain is invalid')
    }
    cookieString += `; Domain=${options.domain}`
  }

  if (options.path) {
    if (!fieldContentRegExp.test(options.path)) {
      throw new TypeError('option path is invalid')
    }
    cookieString += `; Path=${options.path}`
  }

  if (options.expires) {
    cookieString += `; Expires=${options.expires.toUTCString()}`
  }

  if (options.httpOnly) {
    cookieString += '; HttpOnly'
  }

  if (options.secure) {
    cookieString += '; Secure'
  }

  if (options.partitioned) {
    cookieString += '; Partitioned'
  }

  if (options.priority) {
    cookieString += `; Priority=${getPriority(options.priority)}`
  }

  if (options.sameSite) {
    cookieString += `; SameSite=${getSameSite(options.sameSite)}`
  }

  return cookieString
}

export interface CookieParseOptions {
  decode?: (value: string) => string
}

export function parseCookie(
  serializedCookie: string,
  options?: CookieParseOptions,
): Record<string, string> {
  const decode = options?.decode ?? decodeURIComponent

  const cookies = serializedCookie
    .split(';')
    .map((keyValue) => keyValue.split(/=(.*)/))
    .reduce(
      (accummulated, [key, value]) => {
        if (key == null || value == null || key in accummulated) {
          return accummulated
        }

        const trimmedValue = value.trim()

        const unquotedValue =
          trimmedValue.charCodeAt(0) === 0x22 ? trimmedValue.slice(1, -1) : trimmedValue

        accummulated[key.trim()] = safeTransform(unquotedValue, decode)

        return accummulated
      },
      {} as Record<string, string>,
    )

  return cookies
}

function getPriority(value: string) {
  const priority = value.toLowerCase()

  switch (priority) {
    case 'low':
    case 'medium':
    case 'high':
    default:
      return priority.charAt(0).toUpperCase() + priority.slice(1)
  }
}

function getSameSite(value: string | true) {
  const sameSite = typeof value === 'string' ? value.toLowerCase() : value

  switch (sameSite) {
    case true:
    case 'strict':
      return 'Strict'

    case 'lax':
    case 'none':
    default:
      return sameSite.charAt(0).toUpperCase() + sameSite.slice(1)
  }
}

function safeTransform<T>(value: T, transform: (value: T) => T) {
  try {
    return transform(value)
  } catch {
    return value
  }
}

export interface CreateCookiesOptions {
  name?: string
  securePrefix?: string
  serialize?: CookieSerializeOptions
}

export interface CookieOption {
  name: string
  options: CookieSerializeOptions
}

export function getCookiePrefix(options?: CreateCookiesOptions): string {
  const cookieName = options?.name ?? DEFAULT_COOKIE_NAME
  const securePrefix = options?.securePrefix ?? DEFAULT_SECURE_PREFIX

  return `${options?.serialize?.secure ? securePrefix : ''}${cookieName}`
}

export const DEFAULT_CREATE_COOKIES_OPTIONS: CreateCookiesOptions = {
  serialize: {
    path: '/',
    sameSite: 'lax',
  },
}
