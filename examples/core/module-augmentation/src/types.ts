/**
 * A literal union allows anything covered by T or U.
 *
 * The significance of this type is that it autocompletes anything in T.
 * For example, you can have a union of specific strings for guiding autocompletion,
 * but still allow any arbitrary string.
 *
 * @example
 *
 * ```ts
 * type Pet = 'dog' | 'cat' | 'bird'
 * type Animal = LiteralUnion<Pet, string>
 *
 * let myAnimal: Animal = 'dog'
 *
 * myAnimal = 'cat' // OK, because it's of type Pet
 * myAnimal = 'dolphin' // OK, because it's of type string
 * myAnimal = 'monke' // OK, because it's of type string
 *
 * myAnimal = 123 // Error, because it's not of type Pet or string
 * ```
 *
 * [TypeScript Playground](https://www.typescriptlang.org/play?#code/KYDwDg9gTgLgBDAnmYcAyBLGwoEMA2AqgHYYTEA8AKgDRyEB8cAvHFXAD5wAUhcAZHADecAPoB+AFxxiwAG444AXwCUAKDUJkqAArB4rAOQATCAHNDnOIYDGuGJa6GARhijHDmpCjgBBUgC2BCzoWDgEJGSUejB0AM4wUBjEZgyamvj6cAGI-hhB+NJ5BSEm5p5wmjnFwUZ2DnAA9I1wAPIA0nTOwHYArnGoWIZxcBAAZlo+MVW5gbXWpvhgABbJls1tnXDdfQNwQyPjk6gJSSkzNfilAeQA1sDrLR1dPbj9gw6HE94niclmFzmV1YAEYAEwAZiAA)
 */
export type LiteralUnion<T, U> = T | (U & { _?: never })
