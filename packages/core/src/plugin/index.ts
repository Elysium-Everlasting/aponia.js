import type { CookieSerializeOptions } from '../security/cookie'

export type CreateCookiesOptions = {
  name?: string
  securePrefix?: string
  serialize?: CookieSerializeOptions
}

export type Listener<T> = (data: T) => unknown

/**
 */
export class PluginCoordinator {
  cookies = new Array<Listener<CreateCookiesOptions>>()

  onCookies(listener: Listener<CreateCookiesOptions>) {
    this.cookies.push(listener)
  }

  emitCookies(options: CreateCookiesOptions) {
    this.cookies.forEach((listener) => listener(options))
  }
}
