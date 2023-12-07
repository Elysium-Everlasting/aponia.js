import { ACCESS_TOKEN_NAME, DEFAULT_ACCESS_TOKEN_AGE, DEFAULT_SECRET } from '../constants'
import type { PluginCoordinator } from '../plugin'
import {
  getCookiePrefix,
  type Cookie,
  type CookieOption,
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

    this.cookies = createClientCookiesOptions({
      ...config.cookie,
      serialize: {
        path: '/',
        sameSite: 'lax',
        ...config.cookie?.serialize,
      },
    })

    this.cookies.accessToken.options.maxAge ??= DEFAULT_ACCESS_TOKEN_AGE

    this.jwt = {
      ...config.jwt,
      secret: config.jwt?.secret ?? DEFAULT_SECRET,
      maxAge: config.jwt?.maxAge ?? DEFAULT_ACCESS_TOKEN_AGE,
    }

    this.encode = config.jwt?.encode ?? encode

    this.decode = config.jwt?.decode ?? decode
  }

  initialize(plugin: PluginCoordinator) {
    plugin.on('cookies', (options) => {
      this.cookies = createClientCookiesOptions({
        ...options,
        serialize: {
          path: '/',
          sameSite: 'lax',
          ...options.serialize,
        },
      })

      this.cookies.accessToken.options.maxAge ??= DEFAULT_ACCESS_TOKEN_AGE
    })

    plugin.on('jwt', (options) => {
      this.jwt = {
        ...options,
        maxAge: options.maxAge ?? this.jwt.maxAge,
        secret: options.secret ?? this.jwt.secret,
      }

      this.encode = options.encode ?? this.encode

      this.decode = options.decode ?? this.decode
    })
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

export interface ClientCookiesOptions {
  accessToken: CookieOption
}

export function createClientCookiesOptions(options?: CreateCookiesOptions): ClientCookiesOptions {
  // const secure = options?.serialize?.secure
  const cookiePrefix = getCookiePrefix(options)
  const serializeOptions = { ...options?.serialize }

  return {
    accessToken: {
      name: `${cookiePrefix}.${ACCESS_TOKEN_NAME}`,
      options: serializeOptions,
    },
    // csrfToken: {
    //   /**
    //    * Default to __Host- for CSRF token for additional protection if using secure cookies.
    //    * NB: The `__Host-` prefix is stricter than the `__Secure-` prefix.
    //    */
    //   name: `${secure ? HOST_PREFIX : cookiePrefix}.${CSRF_TOKEN_NAME}`,
    //   options: serializeOptions,
    // },
  }
}
