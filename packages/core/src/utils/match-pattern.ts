import type { Pattern } from './types'

export function matchPattern(value: string, pattern: Pattern): RegExpExecArray | null {
  const regexp = new RegExp(pattern)
  return regexp.exec(value)
}
