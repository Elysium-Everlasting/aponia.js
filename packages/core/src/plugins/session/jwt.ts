import {
  DEFAULT_ACCESS_TOKEN_AGE,
  DEFAULT_REFRESH_TOKEN_AGE,
  DEFAULT_SECRET,
} from '../../constants'
import { encode, decode } from '../../security/jwt'

import { DEFAULT_SESSION_COOKIES_OPTIONS, SessionPlugin, type SessionPluginConfig } from './index'

export interface JwtSessionPluginConfig extends SessionPluginConfig {
  secret?: string
}

export class JwtSessionPlugin extends SessionPlugin {
  secret: string

  constructor(config: JwtSessionPluginConfig = {}) {
    const accessTokenMaxAge =
      config.cookie?.accessToken?.options?.maxAge ?? DEFAULT_ACCESS_TOKEN_AGE

    const refreshTokenMaxAge =
      config.cookie?.refreshToken?.options?.maxAge ?? DEFAULT_REFRESH_TOKEN_AGE

    const secret = config.secret ?? DEFAULT_SECRET

    config.cookie = {
      accessToken: {
        name: config.cookie?.accessToken?.name ?? DEFAULT_SESSION_COOKIES_OPTIONS.accessToken.name,
        options: {
          ...DEFAULT_SESSION_COOKIES_OPTIONS.accessToken.options,
          ...config.cookie?.accessToken?.options,
          maxAge: accessTokenMaxAge,
        },
      },
      refreshToken: {
        name:
          config.cookie?.refreshToken?.name ?? DEFAULT_SESSION_COOKIES_OPTIONS.refreshToken.name,
        options: {
          ...DEFAULT_SESSION_COOKIES_OPTIONS.refreshToken.options,
          ...config.cookie?.refreshToken?.options,
          maxAge: refreshTokenMaxAge,
        },
      },
    }

    config.secret = secret
    config.encodeSession ??= (session) =>
      encode({ token: session, secret, maxAge: accessTokenMaxAge })
    config.decodeSession ??= (token) => decode({ token, secret })
    config.encodeRefresh ??= (session) =>
      encode({ token: session, secret, maxAge: refreshTokenMaxAge })
    config.decodeRefresh ??= (token) => decode({ token, secret })

    super(config)

    this.secret = config.secret
  }
}
