import { DEFAULT_REFRESH_TOKEN_AGE, REFRESH_TOKEN_NAME } from '../../constants'
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

export type RefreshEncoder = (refresh: Aponia.Refresh) => Awaitable<string>

export type RefreshDecoder = (token: string) => Awaitable<Aponia.Refresh | Nullish>

export interface RefreshPluginConfig {
  logger?: Logger
  encode?: RefreshEncoder
  decode?: RefreshDecoder
  cookie?: CreateCookiesOptions
}

export class RefreshPlugin implements Plugin {
  config: RefreshPluginConfig

  logger: Logger

  encode: RefreshEncoder

  decode: RefreshDecoder

  cookies: RefreshCookiesOptions

  constructor(config: RefreshPluginConfig = {}) {
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

    this.cookies = createRefreshCookiesOptions({
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
      if (response?.refresh != null) {
        const cookies = await this.createCookiesFromRefresh(response.refresh)
        response.cookies ??= []
        response.cookies.push(...cookies)
      }
    } catch (error) {
      this.logger.error(error)
    }
  }

  async createCookiesFromRefresh(session: Aponia.Session): Promise<Cookie[]> {
    try {
      const accessToken = await this.encode(session)

      const sessionCookie: Cookie = {
        name: this.cookies.refreshToken.name,
        value: accessToken,
        options: this.cookies.refreshToken.options,
      }

      return [sessionCookie]
    } catch (error) {
      this.logger.error(error)
      return []
    }
  }

  async parseRefreshFromCookies(
    cookies: Record<string, string> | CookiesProxy,
    options?: CookiesProxyParseOptions,
  ): Promise<Aponia.Refresh | Nullish> {
    const rawAccessToken = getCookieValue(cookies, this.cookies.refreshToken.name, options)

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

export interface RefreshCookiesOptions {
  refreshToken: CookieOption
}

export function createRefreshCookiesOptions(options?: CreateCookiesOptions): RefreshCookiesOptions {
  const cookiePrefix = getCookiePrefix(options)
  const serializeOptions = { ...options?.serialize }

  return {
    refreshToken: {
      name: `${cookiePrefix}.${REFRESH_TOKEN_NAME}`,
      options: {
        maxAge: DEFAULT_REFRESH_TOKEN_AGE,
        ...serializeOptions,
      },
    },
  }
}

export const DEFAULT_SESSION_COOKIES_OPTIONS = createRefreshCookiesOptions(
  DEFAULT_CREATE_COOKIES_OPTIONS,
)
