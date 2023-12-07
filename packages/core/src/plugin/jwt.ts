import { DEFAULT_SECRET } from '../constants'
import { encode, decode } from '../security/jwt'

import type { Plugin } from '.'

export interface JwtPluginOptions {
  secret?: string
  jwt?: boolean
  checker?: boolean
}

export function jwtPlugin(options: JwtPluginOptions = {}): Plugin {
  const secret = options.secret ?? DEFAULT_SECRET

  return {
    name: 'jwt',
    setup: (plugin) => {
      if (options.jwt !== false) {
        plugin.emit('jwt', { secret, encode, decode })
      }

      if (options.checker !== false) {
        const checkerEncode = async (value: string): Promise<string> => {
          return await encode({ secret, token: { value } })
        }

        const checkerDecode = async (token: string): Promise<string> => {
          return await decode({ secret, token }).then((result) => result?.['value'])
        }

        plugin.emit('checker', { encode: checkerEncode, decode: checkerDecode })
      }
    },
  }
}
