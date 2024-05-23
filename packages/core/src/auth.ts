import { Logger } from './logger'
import type { Plugin, PluginContext, PluginOptions } from './plugins/plugin'
import { Router, type Method } from './router'
import { serializeCookie, type CreateCookiesOptions, parseCookie } from './security/cookie'
import { matchPattern } from './utils/match-pattern'
import type { Nullish, Pattern } from './utils/types'

export interface AuthConfig {
  logger?: Logger
  cookies?: CreateCookiesOptions
  plugins?: Plugin[]
  exclude?: Pattern[]
  origin?: string
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

  exclude: Pattern[]

  origin?: string

  constructor(config: AuthConfig = {}) {
    this.config = config
    this.logger = config.logger ?? new Logger()
    this.cookies = config.cookies
    this.plugins = config.plugins ?? []
    this.exclude = config.exclude ?? []
    this.origin = config.origin

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
      origin: this.origin,
    }
  }

  private shouldIgnoreRoute(request: Aponia.Request): boolean {
    return this.exclude.some((pattern) => {
      return matchPattern(request.url.pathname, pattern) != null
    })
  }

  public async handle(request: Aponia.Request): Promise<Aponia.Response | undefined> {
    let internalRequest =
      request instanceof Request
        ? {
            url: new URL(request.url),
            method: request.method,
            cookies: parseCookie(request.headers.get('cookie')),
            headers: request.headers,
          }
        : request

    if (this.shouldIgnoreRoute(internalRequest)) return

    const preHandlers = this.router.getPreHandlers(internalRequest.url.pathname)
    const mainHandler = this.router.getHandler(
      internalRequest.method as Method,
      internalRequest.url.pathname,
    )
    const postHandlers = this.router.getPostHandlers(internalRequest.url.pathname)

    for (const preHandler of preHandlers) {
      const modifiedRequest = await preHandler(internalRequest)
      if (modifiedRequest) {
        internalRequest = modifiedRequest
      }
    }

    let response = (await mainHandler?.(internalRequest)) ?? undefined

    for (const postHandler of postHandlers) {
      const modifiedResponse = await postHandler(internalRequest, response)
      if (modifiedResponse) {
        response = modifiedResponse
      }
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
