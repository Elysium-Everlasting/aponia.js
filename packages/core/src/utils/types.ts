export type Awaitable<T> = T | PromiseLike<T>

export type Nullish = null | undefined | void

export type IsAny<T> = 0 extends 1 & T ? true : false

export type IsDate<T> = T extends Date ? true : false

export type IsFunction<T> = T extends (...args: any[]) => any ? true : false

export type DeepPartial<T> = IsAny<T> extends true
  ? any
  : IsFunction<NonNullable<T>> extends true
  ? T
  : IsDate<NonNullable<T>> extends true
  ? T
  : T extends Record<PropertyKey, any>
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T

export type Pattern = RegExp | string

/**
 * Allows any kind of string, but also has autocomplete.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type StringAutocomplete<T> = T | (string & {})
