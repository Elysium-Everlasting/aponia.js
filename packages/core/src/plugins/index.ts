import type { Awaitable } from '../utils/types'

/**
 */
export interface Plugin {
  name: string
  cookie?: CookiePlugin
}

export interface CookiePlugin {
  encode: (value: string) => Awaitable<any>
  decode: (value: string) => Awaitable<any>
}
