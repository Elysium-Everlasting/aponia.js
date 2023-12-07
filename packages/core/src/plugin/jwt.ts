import { DEFAULT_ACCESS_TOKEN_AGE, DEFAULT_SECRET } from '../constants'
import { encode, decode } from '../security/jwt'

import type { Plugin } from '.'

export interface JwtPluginOptions {
  secret?: string
  session?: boolean
  checker?: boolean
}

export function jwtPlugin(options: JwtPluginOptions = {}): Plugin {
  const secret = options.secret ?? DEFAULT_SECRET

  return {
    name: 'jwt',
    setup: (plugin) => {
      if (options.session !== false) {
        const sessionEncode = async (session: Aponia.Session): Promise<string> => {
          return await encode({
            secret,
            token: session,
            maxAge: DEFAULT_ACCESS_TOKEN_AGE,
          })
        }

        const sessionDecode = async (token: string): Promise<Aponia.Session | undefined> => {
          return await decode({ secret, token })
        }

        plugin.emit('session', {
          encode: sessionEncode,
          decode: sessionDecode,
        })
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
