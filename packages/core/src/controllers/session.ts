import type { User } from '@auth/core/types'
import { parse } from 'cookie'
import { defu } from 'defu'

import {
  createCookiesOptions,
  type Cookie,
  type CookiesOptions,
  type CreateCookiesOptions,
} from '../security/cookie'
import { encode, decode } from '../security/jwt'
import type { JWTOptions } from '../security/jwt'
import type { InternalRequest, InternalResponse } from '../types'
import type { Awaitable, DeepPartial, Nullish } from '../utils/types'

const hourInSeconds = 60 * 60

const weekInSeconds = 7 * 24 * hourInSeconds

const DefaultAccessTokenMaxAge = hourInSeconds

const DefaultRefreshTokenMaxAge = weekInSeconds

/**
 * Ensure a possibly async value is a `Promise`.
 */
function asPromise<T>(value: Awaitable<T>): Promise<T> {
  return value instanceof Promise ? value : Promise.resolve(value)
}

/**
 * Create a new session.
 */
export interface NewSession {
  /**
   * The user for this request.
   * If not defined, {@link Session.getUserFromRequest} will need to decode the access token from scratch.
   * If defined, the user will be saved in the request and {@link Session.getUserFromRequest} won't need to decode the access token.
   *
   * TLDR: it might seem redundant to define both access token and user, but it can be more efficient :^) .
   */
  user?: User

  /**
   * The new access token.
   */
  accessToken: Aponia.AccessToken

  /**
   * The new refresh token.
   */
  refreshToken?: Aponia.RefreshToken
}

/**
 * Session details for an expired or invalid session that contains a refresh token.
 */
export interface OldSession {
  /**
   * The old access token.
   */
  accessToken?: Aponia.AccessToken | Nullish

  /**
   * The refresh token that should be handled, i.e. by generating a new session and access/refresh tokens.
   */
  refreshToken: Aponia.RefreshToken
}

/**
 * Internal session configuration.
 */
export interface SessionConfig {
  /**
   * The secret used to sign the JWT. Must be at least 1 character long.
   *
   * @default 'secret'
   */
  secret: string

  /**
   */
  pages: {
    /**
     * Where to redirect the user after logging out.
     */
    logoutRedirect: string
  }

  /**
   * Custom the JWT options.
   */
  jwt: Required<Omit<JWTOptions, 'maxAge'>>

  /**
   * Options when generating the options for all the cookies.
   */
  createCookieOptions?: CreateCookiesOptions

  /**
   * The options to use for the various cookies set by the session manager.
   */
  cookieOptions: CookiesOptions

  /**
   * Given a user that just logged in, create a new session.
   *
   * @example
   * A session might only contain the user ID,
   * so this function would generate a new access token that only contains the user ID.
   *
   * @default
   * (user) => ({ user, accessToken: user })
   * i.e. The session is the user itself, and a new access token is created with the user's info.
   */
  createSession?: (user: User) => Awaitable<NewSession | Nullish>

  /**
   * Given a session, extract the user from it.
   *
   * @example If a session only contains the user ID, this function would fetch the user from the database.
   *
   * @default
   * (session) => session
   * i.e. The session is the user itself.
   */
  getAccessTokenUser?: (session: Aponia.AccessToken) => Awaitable<User | Nullish>

  /**
   * Given the info
   */
  handleRefresh?: (tokens: OldSession) => Awaitable<NewSession | Nullish>

  onInvalidateAccessToken?: (
    accessToken: Aponia.AccessToken,
    refreshToken: Aponia.RefreshToken | Nullish,
  ) => Awaitable<InternalResponse | Nullish>
}

/**
 * Session user configuration.
 */
export type SessionUserConfig = DeepPartial<SessionConfig>

/**
 * Session manager.
 */
export class Session {
  config: SessionConfig

  constructor(config?: SessionUserConfig) {
    const cookieOptions = createCookiesOptions(config?.createCookieOptions)

    cookieOptions.accessToken.options.maxAge ??= DefaultAccessTokenMaxAge
    cookieOptions.refreshToken.options.maxAge ??= DefaultRefreshTokenMaxAge

    const secret = config?.secret || 'secret'

    // hkdf throws an error if it attempts to encrypt something with a key that's less than 1 character.
    // Might as well throw the error now instead of later during a request, where it's harder to debug.
    if (secret.length === 0) {
      throw new Error('The secret must be at least 1 character long')
    }

    this.config = defu(config, {
      secret,
      pages: {
        logoutRedirect: '/auth/login',
      },
      jwt: {
        secret,
        encode,
        decode,
      },
      maxAge: {
        accessToken: DefaultAccessTokenMaxAge,
        refreshToken: DefaultRefreshTokenMaxAge,
      },
      cookieOptions,
    })
  }

  /**
   * Decode the JWT, encrypted access and refresh tokens.
   */
  async decodeTokens(tokens: { accessToken?: string; refreshToken?: string }) {
    const accessTokenData = await asPromise(
      this.config.jwt.decode<Aponia.AccessToken>({
        secret: this.config.secret,
        token: tokens.accessToken,
      }),
    ).catch((e) => {
      console.log('Error decoding access token', e)
    })

    const refreshTokenData = await asPromise(
      this.config.jwt.decode<Aponia.RefreshToken>({
        secret: this.config.secret,
        token: tokens.refreshToken,
      }),
    ).catch((e) => {
      console.log('Error decoding access token', e)
    })

    return { accessTokenData, refreshTokenData }
  }

  /**
   * Create cookies from a new session.
   */
  async createCookies(newSession: NewSession): Promise<Cookie[]> {
    const cookies: Cookie[] = []

    if (newSession?.accessToken) {
      cookies.push({
        name: this.config.cookieOptions.accessToken.name,
        value: await this.config.jwt.encode({
          secret: this.config.secret,
          maxAge: this.config.cookieOptions.accessToken.options.maxAge,
          token: newSession.accessToken,
        }),
        options: this.config.cookieOptions.accessToken.options,
      })
    }

    if (newSession?.refreshToken) {
      cookies.push({
        name: this.config.cookieOptions.refreshToken.name,
        value: await this.config.jwt.encode({
          secret: this.config.secret,
          maxAge: this.config.cookieOptions.refreshToken.options.maxAge,
          token: newSession.refreshToken,
        }),
        options: this.config.cookieOptions.refreshToken.options,
      })
    }

    return cookies
  }

  /**
   * Get the user from a request.
   */
  async getUserFromRequest(request: InternalRequest): Promise<User | null> {
    const encodedAccessToken = request.cookies[this.config.cookieOptions.accessToken.name]

    const { accessTokenData: accessToken } = await this.decodeTokens({
      accessToken: encodedAccessToken,
    })

    if (!accessToken) {
      return null
    }

    const user = (await this.config.getAccessTokenUser?.(accessToken)) ?? accessToken
    return user ?? null
  }

  /**
   * Handle a request by refreshing the user's session if necessary and possible.
   */
  async handleRequest(request: InternalRequest): Promise<InternalResponse> {
    const accessToken = request.cookies[this.config.cookieOptions.accessToken.name]
    const refreshToken = request.cookies[this.config.cookieOptions.refreshToken.name]

    if (accessToken || (!accessToken && !refreshToken)) {
      return {}
    }

    const { accessTokenData, refreshTokenData } = await this.decodeTokens({
      accessToken,
      refreshToken,
    })

    if (refreshTokenData == null) {
      return {}
    }

    const refreshedTokens = (await this.config.handleRefresh?.({
      accessToken: accessTokenData,
      refreshToken: refreshTokenData,
    })) ?? {
      user: refreshTokenData,
      accessToken: refreshTokenData,
      refreshToken: refreshTokenData,
    }

    return {
      user: refreshedTokens?.user,
      cookies: refreshedTokens ? await this.createCookies(refreshedTokens) : undefined,
    }
  }

  /**
   * Log a user out.
   */
  async logout(request: Request): Promise<InternalResponse> {
    const cookies = parse(request.headers.get('cookie') ?? '')

    const accessToken = cookies[this.config.cookieOptions.accessToken.name]
    const refreshToken = cookies[this.config.cookieOptions.refreshToken.name]

    const { accessTokenData, refreshTokenData } = await this.decodeTokens({
      accessToken,
      refreshToken,
    })

    let response: InternalResponse = {}

    if (accessTokenData) {
      const invalidateResponse = await this.config.onInvalidateAccessToken?.(
        accessTokenData,
        refreshTokenData,
      )
      if (invalidateResponse) {
        response = invalidateResponse
      }
    }

    response.status ??= 302
    response.redirect ??= this.config.pages.logoutRedirect
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

/**
 * Create a new session manager.
 */
export const createSession = (config: SessionUserConfig) => new Session(config)
