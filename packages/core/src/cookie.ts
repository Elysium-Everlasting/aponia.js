/**
 * @see https://github.com/jshttp/cookie
 */

export type CookiePriority = 'low' | 'medium' | 'high'

export type CookieSameSite = true | false | 'lax' | 'strict' | 'none'

export type CookieSerializeOptions = {
  domain?: string
  encode?: (value: string) => string
  expires?: Date
  httpOnly?: boolean
  maxAge?: number
  path?: string
  priority?: CookiePriority
  sameSite?: CookieSameSite
  secure?: boolean
}

export function serializeCookie(
  name: string,
  value: string,
  options: CookieSerializeOptions = {},
): string {
  const encode = options.encode ?? encodeURIComponent

  let serializedCookie = `${name}=${encode(value)}`

  if (options.maxAge != null) {
    serializedCookie += `; Max-Age=${getMaxAge(options.maxAge)}`
  }

  if (options.domain) {
    serializedCookie += `; Domain=${options.domain}`
  }

  if (options.path) {
    serializedCookie += `; Path=${options.path}`
  }

  if (options.expires) {
    serializedCookie += `; Expires=${options.expires.toUTCString()}`
  }

  if (options.httpOnly) {
    serializedCookie += '; HttpOnly'
  }

  if (options.secure) {
    serializedCookie += '; Secure'
  }

  if (options.priority) {
    serializedCookie += `; Priority=${getPriority(options.priority)}`
  }

  if (options.sameSite) {
    serializedCookie += `; SameSite=${getSameSite(options.sameSite)}`
  }

  return serializedCookie
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

function getMaxAge(value: number) {
  if (isNaN(value) || !isFinite(value)) {
    throw new TypeError('maxAge is invalid')
  }
  return Math.floor(value)
}

function getPriority(value: string) {
  const priority = value.toLowerCase()

  switch (priority) {
    case 'low':
    case 'medium':
    case 'high':
      return priority.charAt(0).toUpperCase() + priority.slice(1)

    default:
      throw new TypeError('option priority is invalid')
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
      return sameSite.charAt(0).toUpperCase() + sameSite.slice(1)

    default:
      throw new TypeError('option sameSite is invalid')
  }
}

function safeTransform<T>(value: T, transform: (value: T) => T) {
  try {
    return transform(value)
  } catch {
    return value
  }
}
