import { DEFAULT_REFRESH_TOKEN_AGE, REFRESH_TOKEN_NAME } from '../constants'
import { Logger } from '../logger'
import {
  getCookiePrefix,
  type CookieOption,
  type CreateCookiesOptions,
  DEFAULT_CREATE_COOKIES_OPTIONS,
} from '../security/cookie'
import type { Awaitable, Nullish } from '../utils/types'

import type { Plugin, PluginContext, PluginOptions } from './plugin'
import { createSessionCookiesOptions } from './session'

export interface LogoutPluginConfig {
  logger?: Logger
  logoutRoute?: string
  redirectRoute?: string
  onLogout?: (
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Nullish | Aponia.Response>
}

export interface LogoutCookiesOptions {
  accessToken: CookieOption
  refreshToken: CookieOption
}

export class LogoutPlugin implements Plugin {
  cookies: LogoutCookiesOptions

  logger: Logger

  redirectRoute: string

  logoutRoute: string

  config?: LogoutPluginConfig

  constructor(config?: LogoutPluginConfig) {
    this.config = config
    this.cookies = DEFAULT_LOGOUT_COOKIES_OPTIONS
    this.logger = config?.logger ?? new Logger()
    this.logoutRoute = config?.logoutRoute ?? '/auth/logout'
    this.redirectRoute = config?.redirectRoute ?? '/'
  }

  async initialize(context: PluginContext, options: PluginOptions): Promise<void> {
    if (options.logger) {
      this.logger = options.logger
    }

    this.cookies = createLogoutCookiesOptions({
      ...DEFAULT_CREATE_COOKIES_OPTIONS,
      ...options,
      serialize: {
        ...DEFAULT_CREATE_COOKIES_OPTIONS.serialize,
        ...options?.cookieOptions?.serialize,
      },
    })

    context.router.post(this.logoutRoute, this.handle.bind(this))
  }

  async handle(request: Aponia.Request) {
    const response: Aponia.Response = {
      status: 302,
      redirect: this.redirectRoute,
    }

    response.cookies ??= []

    response.cookies.push({
      name: this.cookies.accessToken.name,
      value: '',
      options: {
        ...this.cookies.accessToken.options,
        maxAge: 0,
      },
    })

    response.cookies.push({
      name: this.cookies.refreshToken.name,
      value: '',
      options: {
        ...this.cookies.refreshToken.options,
        maxAge: 0,
      },
    })

    const userResponse = await this.config?.onLogout?.(request, response)

    return userResponse ?? response
  }
}

export function createLogoutCookiesOptions(options?: CreateCookiesOptions): LogoutCookiesOptions {
  const sessionCookies = createSessionCookiesOptions(options)
  const cookiePrefix = getCookiePrefix(options)
  const serializeOptions = { ...options?.serialize }

  return {
    ...sessionCookies,
    refreshToken: {
      name: `${cookiePrefix}.${REFRESH_TOKEN_NAME}`,
      options: {
        maxAge: DEFAULT_REFRESH_TOKEN_AGE,
        ...serializeOptions,
      },
    },
  }
}

export const DEFAULT_LOGOUT_COOKIES_OPTIONS = createLogoutCookiesOptions(
  DEFAULT_CREATE_COOKIES_OPTIONS,
)
