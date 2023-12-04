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

import { Logger } from './logger'

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

export interface SessionControllerConfig<
  T extends Strategy = 'jwt',
  TTokens extends ResolvedTokens<T> = ResolvedTokens<T>,
> {
  secret: string
  jwt: Required<Omit<JWTOptions, 'maxAge'>>
  logoutRedirect?: string
  createCookieOptions?: CreateCookiesOptions
  cookieOptions: CookiesOptions
  createSession?: (user: User) => Awaitable<SessionTokens | Nullish>
  getSessionFromTokens?: (tokens: TTokens) => Awaitable<Session | Nullish>
  refreshTokens?: (tokens: UnknownSessionTokens) => Awaitable<SessionTokens | Nullish>
  onInvalidate?: (tokens: TTokens) => Awaitable<InternalResponse | Nullish>
}

export type SessionControllerUserConfig<
  T extends Strategy = 'jwt',
  TTokens extends ResolvedTokens<T> = ResolvedTokens<T>,
> = DeepPartial<SessionControllerConfig<T, TTokens>>

export type Strategy = 'jwt' | 'database'

export type ResolvedTokens<T extends Strategy> = T extends 'jwt' ? SessionTokens : RawSessionTokens

export class SessionController<
  T extends Strategy = 'jwt',
  TTokens extends ResolvedTokens<T> = ResolvedTokens<T>,
> {
  strategy: T

  config: SessionControllerConfig<T, TTokens>

  constructor(config?: SessionControllerUserConfig<T, TTokens>, strategy: T = 'jwt' as T) {
    this.strategy = strategy

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

  getRawTokensFromRequest(request: InternalRequest): RawSessionTokens {
    const accessToken = request.cookies[this.config.cookieOptions.accessToken.name]
    const refreshToken = request.cookies[this.config.cookieOptions.refreshToken.name]

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
            }) as Session,
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
            }) as RefreshToken,
          ).catch(() => {
            Logger.log('Error decoding access token')
          })

    return { accessToken, refreshToken }
  }

  async getTokensFromRequest(request: InternalRequest): Promise<TTokens> {
    const rawTokens = this.getRawTokensFromRequest(request)
    return (this.strategy === 'jwt' ? this.decodeRawTokens(rawTokens) : rawTokens) as TTokens
  }

  async createCookiesFromTokens(tokens: SessionTokens): Promise<Cookie[]> {
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

  async getSessionFromRequest(request: InternalRequest): Promise<Session | Nullish> {
    const tokens = await this.getTokensFromRequest(request)

    if (tokens.accessToken == null) {
      return
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

    const refreshedTokens = (await this.config.refreshTokens?.(tokens)) ?? {
      accessToken: tokens.refreshToken,
      refreshToken: tokens.refreshToken,
    }

    const cookies = await this.createCookiesFromTokens(refreshedTokens)
    const session =
      (await this.config.getSessionFromTokens?.(refreshedTokens)) ?? refreshedTokens.accessToken

    return { session, cookies }
  }

  async invalidateSession(request: InternalRequest): Promise<InternalResponse> {
    const response =
      (await this.config.onInvalidate?.(await this.getTokensFromRequest(request))) ?? {}

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
