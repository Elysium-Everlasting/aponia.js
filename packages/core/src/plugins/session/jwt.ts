import { DEFAULT_ACCESS_TOKEN_AGE, DEFAULT_SECRET } from '../../constants'
import { encode, decode } from '../../security/jwt'

import { SessionPlugin, type SessionPluginConfig } from './index'

export interface JwtSessionPluginConfig extends SessionPluginConfig {
  secret?: string
}

export class JwtSessionPlugin extends SessionPlugin {
  secret: string

  constructor(config: JwtSessionPluginConfig = {}) {
    const maxAge = config.cookie?.serialize?.maxAge ?? DEFAULT_ACCESS_TOKEN_AGE
    const secret = config.secret ?? DEFAULT_SECRET

    config.cookie ??= {}
    config.cookie.serialize ??= {}
    config.cookie.serialize.maxAge = maxAge

    config.secret = secret
    config.encodeSession ??= (session) => encode({ token: session, secret, maxAge })
    config.decodeSession ??= (token) => decode({ token, secret })
    config.encodeRefresh ??= (session) => encode({ token: session, secret, maxAge })
    config.decodeRefresh ??= (token) => decode({ token, secret })

    super(config)

    this.secret = config.secret
  }
}
