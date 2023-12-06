import type { Plugin } from '.'

export function createJwtPlugin(): Plugin {
  return {
    name: 'jwt',
  }
}
