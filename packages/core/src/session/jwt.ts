import type { Session } from '@auth/core/types'

import {
  DEFAULT_ACCESS_TOKEN_AGE,
  DEFAULT_LOGOUT_REDIRECT,
  DEFAULT_REFRESH_TOKEN_AGE,
  DEFAULT_SECRET,
} from '../constants'
import { Logger } from '../logger'
import { createCookiesOptions, type Cookie } from '../security/cookie'
import { encode, decode } from '../security/jwt'
import type { JWTOptions } from '../security/jwt'
import type { InternalRequest, InternalResponse } from '../types'
import { asPromise } from '../utils/as-promise'
import type { Awaitable, DeepPartial, Nullish } from '../utils/types'

import type { RawSessionTokens, SessionController, SessionControllerConfig, SessionTokens } from '.'

export interface JwtSessionControllerConfig extends SessionControllerConfig {
  jwt: Required<Omit<JWTOptions, 'maxAge'>>

  createTokensFromSession?: (session: Session) => Awaitable<SessionTokens | Nullish>
  getSessionFromTokens?: (tokens: SessionTokens) => Awaitable<Session | Nullish>
  onInvalidate?: (tokens: SessionTokens) => Awaitable<InternalResponse | Nullish>
}

export type JwtSessionControllerUserConfig = DeepPartial<JwtSessionControllerConfig>

export class JwtSessionController implements SessionController {
  config: JwtSessionControllerConfig

  constructor(config?: JwtSessionControllerUserConfig) {
    const cookieOptions = createCookiesOptions(config?.createCookieOptions)

    cookieOptions.accessToken.options.maxAge ??= DEFAULT_ACCESS_TOKEN_AGE
    cookieOptions.refreshToken.options.maxAge ??= DEFAULT_REFRESH_TOKEN_AGE

    const secret = config?.secret ?? DEFAULT_SECRET

    if (secret.length === 0) {
      throw new Error('The secret must be at least 1 character long')
    }

    this.config = {
      logoutRedirect: DEFAULT_LOGOUT_REDIRECT,
      ...config,
      secret,
      jwt: {
        secret,
        encode,
        decode,
        ...config?.jwt,
      },
      cookieOptions,
    }
  }

  async handleRequest(_request: InternalRequest): Promise<InternalResponse | Nullish> {}

  async getSessionFromCookies(cookies: Record<string, string>): Promise<Session | Nullish> {
    const tokens = await this.getTokensFromCookies(cookies)

    if (tokens.accessToken == null) {
      return
    }

    const session = (await this.config.getSessionFromTokens?.(tokens)) ?? tokens.accessToken
    return session
  }

  async createCookiesFromSession(session: Session): Promise<Cookie[]> {
    const tokens = (await this.config.createTokensFromSession?.(session)) ?? {
      accessToken: session,
      refreshToken: session,
    }

    const cookies: Cookie[] = []

    if (tokens?.accessToken) {
      cookies.push({
        value: await this.config.jwt.encode({
          secret: this.config.secret,
          maxAge: this.config.cookieOptions.accessToken.options.maxAge,
          token: tokens.accessToken,
        }),
        ...this.config.cookieOptions.accessToken,
      })
    }

    if (tokens?.refreshToken) {
      cookies.push({
        value: await this.config.jwt.encode({
          secret: this.config.secret,
          maxAge: this.config.cookieOptions.refreshToken.options.maxAge,
          token: tokens.refreshToken,
        }),
        ...this.config.cookieOptions.refreshToken,
      })
    }

    return cookies
  }

  async invalidateSession(request: InternalRequest): Promise<InternalResponse> {
    const response =
      (await this.config.onInvalidate?.(await this.getTokensFromCookies(request.cookies))) ?? {}

    response.status = 302
    response.redirect = this.config.logoutRedirect
    response.cookies ??= [
      {
        name: this.config.cookieOptions.accessToken.name,
        value: '',
        options: { ...this.config.cookieOptions.accessToken.options, maxAge: 0 },
      },
      {
        name: this.config.cookieOptions.refreshToken.name,
        value: '',
        options: { ...this.config.cookieOptions.refreshToken.options, maxAge: 0 },
      },
    ]

    return response
  }

  async getTokensFromCookies(cookies: Record<string, string>): Promise<SessionTokens> {
    const rawTokens = this.getRawTokensFromCookies(cookies)
    return this.decodeRawTokens(rawTokens)
  }

  getRawTokensFromCookies(cookies: Record<string, string>): RawSessionTokens {
    const accessToken = cookies[this.config.cookieOptions.accessToken.name]
    const refreshToken = cookies[this.config.cookieOptions.refreshToken.name]

    return { accessToken, refreshToken }
  }

  async decodeRawTokens(tokens: RawSessionTokens): Promise<SessionTokens> {
    const accessToken =
      tokens.accessToken == null
        ? undefined
        : await asPromise(
            this.config.jwt.decode({
              secret: this.config.secret,
              token: tokens.accessToken,
            }),
          ).catch(() => {
            Logger.log('Error decoding access token')
          })

    const refreshToken =
      tokens.refreshToken == null
        ? undefined
        : await asPromise(
            this.config.jwt.decode({
              secret: this.config.secret,
              token: tokens.refreshToken,
            }),
          ).catch(() => {
            Logger.log('Error decoding access token')
          })

    return { accessToken, refreshToken }
  }
}

export function createSessionController(config?: JwtSessionControllerUserConfig) {
  return new JwtSessionController(config)
}
