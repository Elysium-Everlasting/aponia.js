import { Logger } from './logger'
import type { Plugin, PluginContext, PluginOptions } from './plugins/plugin'
import { Router, type Method } from './router'
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

  public async handle(request: Aponia.Request): Promise<Aponia.Response | undefined> {
    const preHandlers = this.router.getPreHandlers(request.url.pathname)
    const mainHandler = this.router.getHandler(request.method as Method, request.url.pathname)
    const postHandlers = this.router.getPostHandlers(request.url.pathname)

    for (const preHandler of preHandlers) {
      const modifiedRequest = await preHandler(request)
      if (modifiedRequest) {
        request = modifiedRequest
      }
    }

    let response = await mainHandler?.(request)

    for (const postHandler of postHandlers) {
      const modifiedResponse = await postHandler(request, response)
      if (modifiedResponse) {
        response = modifiedResponse
      }
    }

    return response ?? undefined
  }
}

export function createAuth(config: AuthConfig): Auth {
  return new Auth(config)
}
