/**
 * A possibly asynchronous value.
 */
export type Awaitable<T> = PromiseLike<T> | T

/**
 * Union of nullish values.
 */
export type Nullish = void | undefined | null

/**
 * Make all properties and sub-properties optional.
 */
export type DeepPartial<T> = {
  [k in keyof T]?: T[k] extends Record<string, unknown> ? DeepPartial<T[k]> : T[k]
}
