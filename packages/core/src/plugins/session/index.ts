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
  type CookiesObject,
} from '../../security/cookie'
import type { Awaitable, DeepPartial, Nullish } from '../../utils/types'
import type { Plugin, PluginContext, PluginOptions } from '../plugin'

export type SessionEncoder = (session: Aponia.Session) => Awaitable<string>

export type SessionDecoder = (token: string) => Awaitable<Aponia.Session | Nullish>

export type RefreshEncoder = (session: Aponia.Refresh) => Awaitable<string>

export type RefreshDecoder = (token: string) => Awaitable<Aponia.Refresh | Nullish>

export interface SessionPluginConfig {
  logger?: Logger
  encodeSession?: SessionEncoder
  decodeSession?: SessionDecoder
  encodeRefresh?: RefreshEncoder
  decodeRefresh?: RefreshDecoder
  cookie?: DeepPartial<SessionCookiesOptions>
}

export class SessionPlugin implements Plugin {
  config: SessionPluginConfig

  logger: Logger

  encodeSession: SessionEncoder

  decodeSession: SessionDecoder

  encodeRefresh: RefreshEncoder

  decodeRefresh: RefreshDecoder

  cookies: SessionCookiesOptions

  constructor(config?: SessionPluginConfig) {
    this.config = config ?? {}

    this.logger = this.config.logger ?? new Logger()

    this.encodeSession = this.config.encodeSession ?? JSON.stringify
    this.decodeSession = this.config.decodeSession ?? JSON.parse
    this.encodeRefresh = this.config.encodeRefresh ?? JSON.stringify
    this.decodeRefresh = this.config.decodeRefresh ?? JSON.parse

    this.cookies = {
      accessToken: {
        ...DEFAULT_SESSION_COOKIES_OPTIONS.accessToken,
        ...this.config.cookie?.accessToken,
      },
      refreshToken: {
        ...DEFAULT_SESSION_COOKIES_OPTIONS.refreshToken,
        ...this.config.cookie?.refreshToken,
      },
    }
  }

  initialize(context: PluginContext, options: PluginOptions): Awaitable<void> {
    if (options.logger) {
      this.logger = options.logger
    }

    const newDefaultSessionCookiesOptions = createSessionCookiesOptions(options.cookieOptions)

    this.cookies = {
      accessToken: {
        ...newDefaultSessionCookiesOptions.accessToken,
        ...this.config.cookie?.accessToken,
      },
      refreshToken: {
        ...newDefaultSessionCookiesOptions.refreshToken,
        ...this.config.cookie?.refreshToken,
      },
    }

    context.router.postHandle(this.handle.bind(this))
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
      const accessToken = await this.encodeSession(session)

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

  async createCookiesFromRefresh(session: Aponia.Refresh): Promise<Cookie[]> {
    try {
      const refreshToken = await this.encodeRefresh(session)

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
    cookies: CookiesObject,
    options?: CookiesProxyParseOptions,
  ): Promise<Aponia.Session | undefined> {
    const rawAccessToken = getCookieValue(cookies, this.cookies.accessToken.name, options)

    if (rawAccessToken == null) {
      return
    }

    try {
      const accessToken = await this.decodeSession(rawAccessToken)
      return accessToken ?? undefined
    } catch (error) {
      this.logger.error(error)
      return
    }
  }

  async getRefresh(
    cookies: CookiesObject,
    options?: CookiesProxyParseOptions,
  ): Promise<Aponia.Refresh | undefined> {
    const rawAccessToken = getCookieValue(cookies, this.cookies.refreshToken.name, options)

    if (rawAccessToken == null) {
      return
    }

    try {
      const accessToken = await this.decodeRefresh(rawAccessToken)
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
