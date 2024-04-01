import { Logger } from './logger'
import type { Plugin, PluginContext, PluginOptions } from './plugins/plugin'
import { Router, type Method } from './router'
import { serializeCookie, type CreateCookiesOptions } from './security/cookie'
import type { Nullish } from './utils/types'

export interface AuthConfig {
  logger?: Logger
  cookies?: CreateCookiesOptions
  plugins?: Plugin[]
}

export class Auth {
  public static definedResponseKeys: Array<keyof Aponia.Response> = [
    'body',
    'error',
    'status',
    'cookies',
    'redirect',
  ]

  public static responseIsDefined(
    response?: Aponia.Response | Nullish,
  ): response is Aponia.Response {
    return response != null && Auth.definedResponseKeys.some((k) => response[k] != null)
  }

  logger: Logger

  cookies?: CreateCookiesOptions

  plugins: Plugin[]

  router: Router

  config: AuthConfig

  constructor(config: AuthConfig = {}) {
    this.config = config
    this.logger = config.logger ?? new Logger()
    this.cookies = config.cookies
    this.plugins = config.plugins ?? []

    this.router = new Router()

    this.plugins.forEach((plugin) => {
      plugin.initialize(this.pluginContext, this.pluginOptions)
    })
  }

  get pluginContext(): PluginContext {
    return {
      router: this.router,
    }
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

    let response = (await mainHandler?.(request)) ?? undefined

    if (response != null) {
      response.getSession ??= request.getSession
      response.getRefresh ??= request.getRefresh
    }

    for (const postHandler of postHandlers) {
      const modifiedResponse = await postHandler(request, response)
      if (modifiedResponse) {
        response = modifiedResponse
      }
    }

    if (response != null || request.getSession || request.getRefresh) {
      response ??= {}
      response.getSession ??= request.getSession
      response.getRefresh ??= request.getRefresh
    }

    return response
  }

  public toResponse(authResponse?: Aponia.Response | Nullish): Response | undefined {
    if (!Auth.responseIsDefined(authResponse)) {
      return undefined
    }

    const body = authResponse.body
      ? JSON.stringify(authResponse.body)
      : authResponse.error
      ? authResponse.error.message
      : undefined

    const headers = new Headers()

    if (authResponse.redirect) {
      headers.set('Location', authResponse.redirect)
    }

    authResponse.cookies?.forEach((cookie) => {
      const cookieString = serializeCookie(cookie.name, cookie.value, cookie.options)
      headers.append('Set-Cookie', cookieString)
    })

    const response = new Response(body, { status: authResponse.status, headers })
    return response
  }
}

export function createAuth(config: AuthConfig): Auth {
  return new Auth(config)
}
