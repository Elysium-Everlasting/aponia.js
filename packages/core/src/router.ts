import { createRouter, type RadixRouter } from 'radix3'

import type { Awaitable, Nullish } from './utils/types'

export const METHODS = ['get', 'post', 'put', 'delete', 'options', 'patch'] as const

export type Method = (typeof METHODS)[number]

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
  response?: Aponia.Response,
) => Awaitable<Aponia.Response | Nullish>

/**
 * Based on hono.js's implementation of a dynamic router class.
 * @see https://github.com/honojs/hono/blob/main/src/hono-base.ts#L30
 */
function defineDynamicClass(): {
  new (): {
    [M in Method]: RouteCreator
  } & {
    preHandle: PreRouteCreator
    postHandle: PostRouteCreator
  }
} {
  return class {} as any
}

export class Router extends defineDynamicClass() {
  routers: Record<Uppercase<Method> | 'pre' | 'post', RadixRouter>

  constructor() {
    super()

    this.routers = {} as any

    METHODS.forEach((method) => {
      this[method] = (...args: any[]) => {
        this.addHandler(method, args[0], args[1])
        return this as any
      }
    })

    this.preHandle = (...args: any[]) => {
      return args.length === 2
        ? this.addPreHandler(args[0], args[1])
        : this.addPreHandler(undefined, args[0])
    }

    this.postHandle = (...args: any[]) => {
      return args.length === 2
        ? this.addPostHandler(args[0], args[1])
        : this.addPostHandler(undefined, args[0])
    }
  }

  private addHandler(rawMethod: string, path: string, handler: RouteHandler) {
    const method = rawMethod.toUpperCase() as Uppercase<Method>

    this.routers[method] ??= createRouter()
    this.routers[method]?.insert(path, { handler })
  }

  private addPreHandler(path = '**', handler: RoutePreHandler) {
    this.routers.pre ??= createRouter()

    const data = this.routers.pre.lookup(path)

    const handlers: RoutePreHandler[] = data?.['handlers'] ?? []
    handlers.push(handler)

    this.routers.pre.insert(path, { handlers })
  }

  private addPostHandler(path = '**', handler: RoutePostHandler) {
    this.routers.post ??= createRouter()

    const data = this.routers.post.lookup(path)

    const handlers: RoutePostHandler[] = data?.['handlers'] ?? []
    handlers.push(handler)

    this.routers.post.insert(path, { handlers })
  }

  public getHandler(rawMethod: Method, path: string): RouteHandler | undefined {
    const method = rawMethod.toUpperCase() as Uppercase<Method>
    const data = this.routers[method]?.lookup(path)
    return data?.['handler']
  }

  public getPreHandlers(path: string): RoutePreHandler[] {
    const data = this.routers.pre?.lookup(path)
    return data?.['handlers'] ?? []
  }

  public getPostHandlers(path: string): RoutePostHandler[] {
    const data = this.routers.post?.lookup(path)
    return data?.['handlers'] ?? []
  }
}
