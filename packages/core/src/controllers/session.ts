import type { Session, User } from '@auth/core/types'

import {
  DEFAULT_ACCESS_TOKEN_AGE,
  DEFAULT_LOGOUT_REDIRECT,
  DEFAULT_REFRESH_TOKEN_AGE,
  DEFAULT_SECRET,
} from '../constants'
import {
  createCookiesOptions,
  type Cookie,
  type CookiesOptions,
  type CreateCookiesOptions,
} from '../security/cookie'
import { encode, decode } from '../security/jwt'
import type { JWTOptions } from '../security/jwt'
import type { InternalRequest, InternalResponse, RefreshToken } from '../types'
import { asPromise } from '../utils/as-promise'
import type { Awaitable, DeepPartial, Nullish } from '../utils/types'

export interface SessionTokens {
  accessToken?: Session | Nullish
  refreshToken?: RefreshToken | Nullish
}

export interface UnknownSessionTokens {
  accessToken?: Session | Nullish
  refreshToken?: RefreshToken | Nullish
}

export interface RawSessionTokens {
  accessToken?: string
  refreshToken?: string
}

export interface SessionControllerConfig {
  secret: string
  jwt: Required<Omit<JWTOptions, 'maxAge'>>
  logoutRedirect?: string
  createCookieOptions?: CreateCookiesOptions
  cookieOptions: CookiesOptions
  createSession?: (user: User) => Awaitable<SessionTokens | Nullish>
  getSessionFromTokens?: (tokens: SessionTokens) => Awaitable<Session | Nullish>
  handleRefresh?: (tokens: UnknownSessionTokens) => Awaitable<SessionTokens | Nullish>
  onInvalidateTokens?: (tokens: SessionTokens) => Awaitable<InternalResponse | Nullish>
}

export type SessionControllerUserConfig = DeepPartial<SessionControllerConfig>

export class SessionController {
  config: SessionControllerConfig

  constructor(config?: SessionControllerUserConfig) {
    const cookieOptions = createCookiesOptions(config?.createCookieOptions)

    cookieOptions.accessToken.options.maxAge ??= DEFAULT_ACCESS_TOKEN_AGE
    cookieOptions.refreshToken.options.maxAge ??= DEFAULT_REFRESH_TOKEN_AGE

    const secret = config?.secret || DEFAULT_SECRET

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

  getRawTokensFromRequest(request: InternalRequest): RawSessionTokens {
    const accessToken = request.cookies[this.config.cookieOptions.accessToken.name]
    const refreshToken = request.cookies[this.config.cookieOptions.refreshToken.name]

    return { accessToken, refreshToken }
  }

  async decodeRawTokens(tokens: RawSessionTokens): Promise<SessionTokens> {
    const accessToken = tokens.accessToken
      ? await asPromise(
          this.config.jwt.decode<Session>({
            secret: this.config.secret,
            token: tokens.accessToken,
          }),
        ).catch((e) => {
          console.log('Error decoding access token', e)
        })
      : undefined

    const refreshToken = tokens.refreshToken
      ? await asPromise(
          this.config.jwt.decode<RefreshToken>({
            secret: this.config.secret,
            token: tokens.refreshToken,
          }),
        ).catch((e) => {
          console.log('Error decoding access token', e)
        })
      : undefined

    return { accessToken, refreshToken }
  }

  async getTokensFromRequest(request: InternalRequest): Promise<SessionTokens> {
    const rawTokens = this.getRawTokensFromRequest(request)
    return this.decodeRawTokens(rawTokens)
  }

  async createCookiesFromTokens(tokens: SessionTokens): Promise<Cookie[]> {
    const cookies: Cookie[] = []

    if (tokens?.accessToken) {
      cookies.push({
        name: this.config.cookieOptions.accessToken.name,
        value: await this.config.jwt.encode({
          secret: this.config.secret,
          maxAge: this.config.cookieOptions.accessToken.options.maxAge,
          token: tokens.accessToken,
        }),
        options: this.config.cookieOptions.accessToken.options,
      })
    }

    if (tokens?.refreshToken) {
      cookies.push({
        name: this.config.cookieOptions.refreshToken.name,
        value: await this.config.jwt.encode({
          secret: this.config.secret,
          maxAge: this.config.cookieOptions.refreshToken.options.maxAge,
          token: tokens.refreshToken,
        }),
        options: this.config.cookieOptions.refreshToken.options,
      })
    }

    return cookies
  }

  async getSessionFromRequest(request: InternalRequest): Promise<Session | Nullish> {
    const tokens = await this.getTokensFromRequest(request)

    if (tokens.accessToken == null) {
      return null
    }

    const session = (await this.config.getSessionFromTokens?.(tokens)) ?? tokens.accessToken
    return session
  }

  async handleRequest(request: InternalRequest): Promise<InternalResponse | Nullish> {
    const rawTokens = this.getRawTokensFromRequest(request)

    if (rawTokens.accessToken != null || rawTokens.refreshToken == null) {
      return
    }

    const tokens = await this.decodeRawTokens(rawTokens)

    if (tokens.refreshToken == null) {
      return
    }

    const refreshedTokens = (await this.config.handleRefresh?.(tokens)) ?? tokens

    return {
      session: refreshedTokens?.accessToken,
      cookies: refreshedTokens ? await this.createCookiesFromTokens(refreshedTokens) : undefined,
    }
  }

  async logout(request: InternalRequest): Promise<InternalResponse> {
    const tokens = await this.getTokensFromRequest(request)

    const response = (await this.config.onInvalidateTokens?.(tokens)) ?? {}

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
}

export const createSessionController = (config: SessionControllerUserConfig) =>
  new SessionController(config)
