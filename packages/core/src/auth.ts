import { Logger } from './logger'
import type { Plugin, PluginContext, PluginOptions } from './plugins/plugin'
import { Router } from './router'
import type { CreateCookiesOptions } from './security/cookie'

export interface AuthConfig {
  logger?: Logger
  cookies?: CreateCookiesOptions
  plugins?: Plugin[]
}

export class Auth {
  logger: Logger

  cookies?: CreateCookiesOptions

  plugins: Plugin[]

  router: Router

  pluginContext: PluginContext

  constructor(config: AuthConfig = {}) {
    this.logger = config.logger ?? new Logger()
    this.cookies = config.cookies
    this.plugins = config.plugins ?? []

    this.router = new Router()
    this.pluginContext = {
      router: this.router,
    }

    this.plugins.forEach((plugin) => {
      plugin.initialize(this.pluginContext, this.pluginOptions)
    })
  }

  get pluginOptions(): PluginOptions {
    return {
      cookieOptions: this.cookies,
      logger: this.logger,
    }
  }

  public async handle(request: Aponia.Request): Promise<Aponia.Response> {
    request
    // pre-handlers
    // main handler
    // post-handlers
    return {}
  }
}

export function createAuth(config: AuthConfig): Auth {
  return new Auth(config)
}
