/**
 * A possibly asynchronous value.
 */
export type MaybePromise<T> = PromiseLike<T> | T
