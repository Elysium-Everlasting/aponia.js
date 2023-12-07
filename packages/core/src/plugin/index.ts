import type { SessionControllerConfig } from '../controllers/session'
import type { CheckerConfig } from '../security/checker'
import type { CreateCookiesOptions } from '../security/cookie'

export type Listener<T> = (data: T) => unknown

export type PluginFn = (plugin: PluginCoordinator) => void

export interface Plugin {
  name: string
  setup: PluginFn
}

export class PluginCoordinator {
  listeners = {
    checker: new Array<Listener<CheckerConfig>>(),
    cookies: new Array<Listener<CreateCookiesOptions>>(),
    session: new Array<Listener<SessionControllerConfig>>(),
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
