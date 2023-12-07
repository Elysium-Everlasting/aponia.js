import { ACCESS_TOKEN_NAME, DEFAULT_ACCESS_TOKEN_AGE } from '../constants'
import {
  getCookiePrefix,
  type Cookie,
  type CookieOption,
  type CreateCookiesOptions,
} from '../security/cookie'
import type { Awaitable } from '../utils/types'

export interface SessionControllerConfig {
  encode?: (session: Aponia.Session) => Awaitable<string>
  decode?: (token: string) => Awaitable<Aponia.Session | undefined>
  cookie?: CreateCookiesOptions
}

export class SessionController {
  config: SessionControllerConfig

  encode: (session: Aponia.Session) => Awaitable<string>

  decode: (token: string) => Awaitable<Aponia.Session | undefined>

  cookies: ClientCookiesOptions

  constructor(config: SessionControllerConfig = {}) {
    this.config = config

    this.encode = config.encode ?? ((value) => JSON.stringify(value))

    this.decode = config.decode ?? ((value) => JSON.parse(value))

    this.cookies = createClientCookiesOptions({
      ...config.cookie,
      serialize: {
        path: '/',
        sameSite: 'lax',
        maxAge: DEFAULT_ACCESS_TOKEN_AGE,
        ...config.cookie?.serialize,
      },
    })
  }

  async createSessionFromUser(user: Aponia.User): Promise<Aponia.Session | undefined> {
    return user
  }

  async createCookiesFromSession(session: Aponia.Session): Promise<Cookie[]> {
    const accessToken = await this.encode(session)

    const sessionCookie: Cookie = {
      name: this.cookies.accessToken.name,
      value: accessToken,
      options: this.cookies.accessToken.options,
    }

    return [sessionCookie]
  }

  async parseSessionFromCookies(
    cookies: Record<string, string>,
  ): Promise<Aponia.Session | undefined> {
    const rawAccessToken = cookies[this.cookies.accessToken.name]

    if (rawAccessToken == null) {
      return
    }

    const accessToken = await this.decode(rawAccessToken)

    return accessToken
  }
}

export interface ClientCookiesOptions {
  accessToken: CookieOption
}

export function createClientCookiesOptions(options?: CreateCookiesOptions): ClientCookiesOptions {
  const cookiePrefix = getCookiePrefix(options)
  const serializeOptions = { ...options?.serialize }

  return {
    accessToken: {
      name: `${cookiePrefix}.${ACCESS_TOKEN_NAME}`,
      options: serializeOptions,
    },
  }
}
