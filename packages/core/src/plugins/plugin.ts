import type { Logger } from '../logger'
import type { Router } from '../router'
import type { CreateCookiesOptions } from '../security/cookie'
import type { Awaitable } from '../utils/types'

export interface Plugin {
  initialize: (context: PluginContext, options: PluginOptions) => Awaitable<void>
}

export interface PluginContext {
  router: Router
}

export interface PluginOptions {
  cookieOptions?: CreateCookiesOptions
  logger?: Logger
  origin?: string
}
