import { ACCESS_TOKEN_NAME, DEFAULT_ACCESS_TOKEN_AGE } from '../../constants'
import { Logger } from '../../logger'
import {
  getCookiePrefix,
  type Cookie,
  type CookieOption,
  type CreateCookiesOptions,
  DEFAULT_CREATE_COOKIES_OPTIONS,
} from '../../security/cookie'
import type { Awaitable, Nullish } from '../../utils/types'
import type { Plugin, PluginContext, PluginOptions } from '../plugin'

export type SessionEncoder = (session: Aponia.Session) => Awaitable<string>

export type SessionDecoder = (token: string) => Awaitable<Aponia.Session | undefined>

export type SessionGetter = (response: Aponia.Response) => Awaitable<Aponia.Session | undefined>

export interface SessionPluginConfig {
  logger?: Logger
  encode?: SessionEncoder
  decode?: SessionDecoder
  getter?: SessionGetter
  cookie?: CreateCookiesOptions
}

export class SessionPlugin implements Plugin {
  config: SessionPluginConfig

  logger: Logger

  encode: SessionEncoder

  decode: SessionDecoder

  getter?: SessionGetter

  cookies: SessionCookiesOptions

  constructor(config: SessionPluginConfig = {}) {
    this.config = config
    this.logger = config.logger ?? new Logger()
    this.encode = config.encode ?? JSON.stringify
    this.decode = config.decode ?? JSON.parse
    this.getter = config.getter
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
    if (response?.account == null) {
      return
    }

    try {
      const session = await this.getSessionFromResponse(response)

      if (session != null) {
        const cookies = await this.createCookiesFromSession(session)
        response.cookies ??= []
        response.cookies.push(...cookies)
      }
    } catch (error) {
      this.logger.error(error)
    }
  }

  async getSessionFromResponse(response: Aponia.Response): Promise<Aponia.Session | undefined> {
    return this.getter?.(response) ?? response.account
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

  async parseSessionFromCookies(cookies: Record<string, string>): Promise<Aponia.Session | void> {
    const rawAccessToken = cookies[this.cookies.accessToken.name]

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
