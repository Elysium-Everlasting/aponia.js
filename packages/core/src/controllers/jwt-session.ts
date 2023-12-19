import { DEFAULT_ACCESS_TOKEN_AGE, DEFAULT_SECRET } from '../constants'
import type { Cookie } from '../security/cookie'
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

  override async createSessionFromUser(user: Aponia.User): Promise<Aponia.Session | undefined> {
    return user
  }

  override async createCookiesFromSession(session: Aponia.Session): Promise<Cookie[]> {
    const accessToken = await this.encode(session)

    const sessionCookie: Cookie = {
      name: this.cookies.accessToken.name,
      value: accessToken,
      options: this.cookies.accessToken.options,
    }

    return [sessionCookie]
  }

  override async parseSessionFromCookies(
    cookies: Record<string, string>,
  ): Promise<Aponia.Session | undefined> {
    const rawAccessToken = cookies[this.cookies.accessToken.name]

    if (rawAccessToken == null) {
      return
    }

    const accessToken = await this.decode(rawAccessToken)

    return accessToken
  }
}
