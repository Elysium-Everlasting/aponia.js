import type { CreateCookiesOptions } from '../security/cookie'
import type { JWTDecodeParams, JWTEncodeParams, JWTOptions } from '../security/jwt'
import type { Awaitable } from '../utils/types'

export type Listener<T> = (data: T) => unknown

export type ExtractListener<T> = T extends Listener<infer U> ? U : never

/**
 */
export class PluginCoordinator {
  listeners = {
    cookies: new Array<Listener<CreateCookiesOptions>>(),
    jwt: new Array<Listener<JWTOptions>>(),
    jwtEncode: new Array<Listener<(params: JWTEncodeParams) => Awaitable<string>>>(),
    jwtDecode: new Array<Listener<(params: JWTDecodeParams) => Awaitable<any>>>(),
  }

  on<T extends keyof typeof this.listeners>(
    event: T,
    listener: (typeof this.listeners)[T] extends Array<infer U> ? U : never,
  ) {
    this.listeners[event].push(listener as never)
  }
}
