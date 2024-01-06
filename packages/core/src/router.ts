import { createRouter, type RadixRouter } from 'radix3'

import type { Awaitable, Nullish } from './utils/types'

export const METHODS = ['get', 'post', 'put', 'delete', 'options', 'patch'] as const

export type Methods = (typeof METHODS)[number]

export type RouteCreator = (path: string, handler: RouteHandler) => void

export interface PreRouteCreator {
  (handler: RoutePreHandler): void
  (path: string, handler: RoutePreHandler): void
}

export interface PostRouteCreator {
  (handler: RoutePostHandler): void
  (path: string, handler: RoutePostHandler): void
}

export type RouteHandler = (request: Aponia.Request) => Awaitable<Aponia.Response | Nullish>

export type RoutePreHandler = (request: Aponia.Request) => Awaitable<Aponia.Request | Nullish>

export type RoutePostHandler = (
  request: Aponia.Request,
  response: Aponia.Response,
) => Awaitable<Aponia.Response | Nullish>

/**
 * Based on hono.js's implementation of a dynamic router class.
 * @see https://github.com/honojs/hono/blob/main/src/hono-base.ts#L30
 */
function defineDynamicClass(): {
  new (): {
    [M in Methods]: () => void
  } & {
    pre: PreRouteCreator
    post: PostRouteCreator
  }
} {
  return class {} as never
}

export class Router extends defineDynamicClass() {
  routers: Record<string, RadixRouter> = {}

  constructor() {
    super()

    METHODS.forEach((method) => {
      this[method] = (...args: any[]) => {
        this.addRoute(method, args[0], args[1])
        return this as any
      }
    })

    this.pre = (...args: any[]) => {
      return args.length === 2
        ? this.addPreRoute(args[0], args[1])
        : this.addPreRoute(undefined, args[0])
    }

    this.post = (...args: any[]) => {
      return args.length === 2
        ? this.addPostRoute(args[0], args[1])
        : this.addPostRoute(undefined, args[0])
    }
  }

  private addRoute(rawMethod: string, path: string, handler: RouteHandler) {
    const method = rawMethod.toUpperCase()

    this.routers[method] ??= createRouter()
    this.routers[method]?.insert(path, { handler })
  }

  private addPreRoute(path = '', handler: RoutePreHandler) {
    this.routers['pre'] ??= createRouter()

    const data = this.routers['pre'].lookup(path)

    const handlers: RoutePreHandler[] = data?.['handlers'] ?? []
    handlers.push(handler)

    this.routers['pre'].insert(path, { handlers })
  }

  private addPostRoute(path = '', handler: RoutePostHandler) {
    this.routers['post'] ??= createRouter()

    const data = this.routers['post'].lookup(path)

    const handlers: RoutePostHandler[] = data?.['handlers'] ?? []
    handlers.push(handler)

    this.routers['post'].insert(path, { handlers })
  }
}
