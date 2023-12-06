import { DEFAULT_ACCESS_TOKEN_AGE, DEFAULT_SECRET } from '../constants'
import {
  createClientCookiesOptions,
  type ClientCookiesOptions,
  type Cookie,
  type CreateCookiesOptions,
} from '../security/cookie'
import {
  decode,
  encode,
  type JWTDecodeParams,
  type JWTEncodeParams,
  type JWTOptions,
} from '../security/jwt'
import type { Awaitable } from '../utils/types'

import type { SessionController } from './session'

export interface JwtSessionControllerConfig {
  cookie?: CreateCookiesOptions
  jwt?: JWTOptions
}

export class JwtSessionController implements SessionController {
  config: JwtSessionControllerConfig

  cookies: ClientCookiesOptions

  jwt: JWTOptions

  encode: (params: JWTEncodeParams) => Awaitable<string>
  decode: (params: JWTDecodeParams) => Awaitable<any>

  constructor(config: JwtSessionControllerConfig = {}) {
    this.config = config

    this.cookies = createClientCookiesOptions(config.cookie)

    this.cookies.accessToken.options.maxAge ??= DEFAULT_ACCESS_TOKEN_AGE

    this.jwt = {
      secret: DEFAULT_SECRET,
      maxAge: DEFAULT_ACCESS_TOKEN_AGE,
      ...config.jwt,
    }

    this.encode = config.jwt?.encode ?? encode
    this.decode = config.jwt?.decode ?? decode
  }

  async createSessionFromUser(user: Aponia.User): Promise<Aponia.Session | undefined> {
    return user
  }

  async createCookiesFromSession(session: Aponia.Session): Promise<Cookie[]> {
    const accessToken = await this.encode({ ...this.jwt, token: session })

    const sessionCookie: Cookie = {
      name: this.cookies.accessToken.name,
      value: accessToken,
      options: this.cookies.accessToken.options,
    }

    return [sessionCookie]
  }

  async parseSessionFromCookies(
    cookies: Record<string, string>,
  ): Promise<Aponia.Session | undefined> {
    const rawAccessToken = cookies[this.cookies.accessToken.name]

    if (rawAccessToken == null) {
      return
    }

    const accessToken = await this.decode({ ...this.jwt, token: rawAccessToken })

    return accessToken
  }
}
