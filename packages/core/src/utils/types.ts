export type Awaitable<T> = PromiseLike<T> | T

export type Nullish = void | undefined | null

export type DeepPartial<T> = {
  [k in keyof T]?: T[k] extends Record<string, unknown> ? DeepPartial<T[k]> : T[k]
}
