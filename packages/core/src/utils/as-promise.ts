import type { Awaitable } from './types'

/**
 * Ensure a possibly async value is a `Promise`.
 */
export function asPromise<T>(value: Awaitable<T>): Promise<T> {
  return value instanceof Promise ? value : Promise.resolve(value)
}
