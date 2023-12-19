import { DEFAULT_ACCESS_TOKEN_AGE, DEFAULT_SECRET } from '../constants'
import { encode, decode } from '../security/jwt'

import { SessionController, type SessionControllerConfig } from './session'

export interface JwtSessionControllerConfig extends SessionControllerConfig {
  secret?: string
}

export class JwtSessionController extends SessionController {
  secret: string

  constructor(config: JwtSessionControllerConfig = {}) {
    const maxAge = config.cookie?.serialize?.maxAge ?? DEFAULT_ACCESS_TOKEN_AGE
    const secret = config.secret ?? DEFAULT_SECRET

    config.cookie ??= {}
    config.cookie.serialize ??= {}
    config.cookie.serialize.maxAge = maxAge

    config.secret = secret
    config.encode ??= (session) => encode({ token: session, secret, maxAge })
    config.decode ??= (token) => decode({ token, secret })

    super(config)

    this.secret = config.secret
  }
}
