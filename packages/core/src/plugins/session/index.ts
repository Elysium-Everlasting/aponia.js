import { ACCESS_TOKEN_NAME, DEFAULT_ACCESS_TOKEN_AGE } from '../../constants'
import { Logger } from '../../logger'
import {
  getCookiePrefix,
  type Cookie,
  type CookieOption,
  type CreateCookiesOptions,
  DEFAULT_CREATE_COOKIES_OPTIONS,
  type CookiesProxy,
  type CookiesProxyParseOptions,
  getCookieValue,
} from '../../security/cookie'
import type { Awaitable, Nullish } from '../../utils/types'
import type { Plugin, PluginContext, PluginOptions } from '../plugin'

export type SessionEncoder = (session: Aponia.Session) => Awaitable<string>

export type SessionDecoder = (token: string) => Awaitable<Aponia.Session | Nullish>

export interface SessionPluginConfig {
  logger?: Logger
  encode?: SessionEncoder
  decode?: SessionDecoder
  cookie?: CreateCookiesOptions
}

export class SessionPlugin implements Plugin {
  config: SessionPluginConfig

  logger: Logger

  encode: SessionEncoder

  decode: SessionDecoder

  cookies: SessionCookiesOptions

  constructor(config: SessionPluginConfig = {}) {
    this.config = config
    this.logger = config.logger ?? new Logger()
    this.encode = config.encode ?? JSON.stringify
    this.decode = config.decode ?? JSON.parse
    this.cookies = DEFAULT_SESSION_COOKIES_OPTIONS
  }

  initialize(context: PluginContext, options: PluginOptions): Awaitable<void> {
    if (options.logger) {
      this.logger = options.logger
    }

    this.cookies = createSessionCookiesOptions({
      ...DEFAULT_CREATE_COOKIES_OPTIONS,
      ...options,
      serialize: {
        ...DEFAULT_CREATE_COOKIES_OPTIONS.serialize,
        ...options?.cookieOptions?.serialize,
      },
    })

    context.router.postHandle(this.handle.bind(this))
  }

  async handle(_request: Aponia.Request, response?: Aponia.Response | Nullish): Promise<void> {
    try {
      if (response?.session != null) {
        const cookies = await this.createCookiesFromSession(response.session)
        response.cookies ??= []
        response.cookies.push(...cookies)
      }
    } catch (error) {
      this.logger.error(error)
    }
  }

  async createCookiesFromSession(session: Aponia.Session): Promise<Cookie[]> {
    try {
      const accessToken = await this.encode(session)

      const sessionCookie: Cookie = {
        name: this.cookies.accessToken.name,
        value: accessToken,
        options: this.cookies.accessToken.options,
      }

      return [sessionCookie]
    } catch (error) {
      this.logger.error(error)
      return []
    }
  }

  async parseSessionFromCookies(
    cookies: Record<string, string> | CookiesProxy,
    options?: CookiesProxyParseOptions,
  ): Promise<Aponia.Session | Nullish> {
    const rawAccessToken = getCookieValue(cookies, this.cookies.accessToken.name, options)

    if (rawAccessToken == null) {
      return
    }

    try {
      const accessToken = await this.decode(rawAccessToken)
      return accessToken
    } catch (error) {
      this.logger.error(error)
    }
  }
}

export interface SessionCookiesOptions {
  accessToken: CookieOption
}

export function createSessionCookiesOptions(options?: CreateCookiesOptions): SessionCookiesOptions {
  const cookiePrefix = getCookiePrefix(options)
  const serializeOptions = { ...options?.serialize }

  return {
    accessToken: {
      name: `${cookiePrefix}.${ACCESS_TOKEN_NAME}`,
      options: {
        maxAge: DEFAULT_ACCESS_TOKEN_AGE,
        ...serializeOptions,
      },
    },
  }
}

export const DEFAULT_SESSION_COOKIES_OPTIONS = createSessionCookiesOptions(
  DEFAULT_CREATE_COOKIES_OPTIONS,
)
