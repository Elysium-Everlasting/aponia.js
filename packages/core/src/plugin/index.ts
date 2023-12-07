import type { CheckerConfig } from '../security/checker'
import type { CreateCookiesOptions } from '../security/cookie'
import type { JWTOptions } from '../security/jwt'

export type Listener<T> = (data: T) => unknown

export type PluginFn = (plugin: PluginCoordinator) => void

export interface Plugin {
  name: string
  setup: PluginFn
}

export class PluginCoordinator {
  listeners = {
    cookies: new Array<Listener<CreateCookiesOptions>>(),
    checker: new Array<Listener<CheckerConfig>>(),
    jwt: new Array<Listener<JWTOptions>>(),
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
