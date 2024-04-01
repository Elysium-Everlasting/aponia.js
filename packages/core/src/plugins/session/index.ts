import {
  ACCESS_TOKEN_NAME,
  DEFAULT_ACCESS_TOKEN_AGE,
  DEFAULT_REFRESH_TOKEN_AGE,
  REFRESH_TOKEN_NAME,
} from '../../constants'
import { Logger } from '../../logger'
import {
  type Cookie,
  type CookieOption,
  type CreateCookiesOptions,
  type CookiesProxyParseOptions,
  getCookiePrefix,
  getCookieValue,
  DEFAULT_CREATE_COOKIES_OPTIONS,
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

    context.router.preHandle(this.preHandle.bind(this))
    context.router.postHandle(this.handle.bind(this))
  }

  async preHandle(request: Aponia.Request) {
    request.getSession = async () => await this.getSession(request)
    request.getRefresh = async () => await this.getRefresh(request)
  }

  async handle(_request: Aponia.Request, response?: Aponia.Response | Nullish): Promise<void> {
    try {
      if (response?.session != null) {
        response.cookies ??= []

        const cookies = await this.createCookiesFromSession(response.session)

        response.cookies.push(...cookies)
      }

      if (response?.refresh != null) {
        response.cookies ??= []

        const cookies = await this.createCookiesFromRefresh(response.refresh)

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

  async createCookiesFromRefresh(session: Aponia.Session): Promise<Cookie[]> {
    try {
      const refreshToken = await this.encode(session)

      const refreshCookie: Cookie = {
        name: this.cookies.refreshToken.name,
        value: refreshToken,
        options: this.cookies.refreshToken.options,
      }

      return [refreshCookie]
    } catch (error) {
      this.logger.error(error)
      return []
    }
  }

  async getSession(
    request: Aponia.Request,
    options?: CookiesProxyParseOptions,
  ): Promise<Aponia.Session | undefined> {
    const rawAccessToken = getCookieValue(request.cookies, this.cookies.accessToken.name, options)

    if (rawAccessToken == null) {
      return
    }

    try {
      const accessToken = await this.decode(rawAccessToken)
      return accessToken ?? undefined
    } catch (error) {
      this.logger.error(error)
      return
    }
  }

  async getRefresh(
    request: Aponia.Request,
    options?: CookiesProxyParseOptions,
  ): Promise<Aponia.Refresh | undefined> {
    const rawAccessToken = getCookieValue(request.cookies, this.cookies.refreshToken.name, options)

    if (rawAccessToken == null) {
      return
    }

    try {
      const accessToken = await this.decode(rawAccessToken)
      return accessToken ?? undefined
    } catch (error) {
      this.logger.error(error)
      return
    }
  }
}

export interface SessionCookiesOptions {
  accessToken: CookieOption
  refreshToken: CookieOption
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
    refreshToken: {
      name: `${cookiePrefix}.${REFRESH_TOKEN_NAME}`,
      options: {
        maxAge: DEFAULT_REFRESH_TOKEN_AGE,
        ...serializeOptions,
      },
    },
  }
}

export const DEFAULT_SESSION_COOKIES_OPTIONS = createSessionCookiesOptions(
  DEFAULT_CREATE_COOKIES_OPTIONS,
)
