import type { CheckerConfig } from '../security/checker'
import type { CreateCookiesOptions } from '../security/cookie'
import type { JWTDecodeParams, JWTEncodeParams, JWTOptions } from '../security/jwt'
import type { Awaitable } from '../utils/types'

export type Listener<T> = (data: T) => unknown

export type Plugin = (plugin: PluginCoordinator) => void

export class PluginCoordinator {
  listeners = {
    cookies: new Array<Listener<CreateCookiesOptions>>(),
    checker: new Array<Listener<CheckerConfig>>(),
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

  emit<T extends keyof typeof this.listeners>(
    event: T,
    data: (typeof this.listeners)[T] extends Array<Listener<infer U>> ? U : never,
  ) {
    this.listeners[event].forEach((listener) => listener(data as never))
  }
}
