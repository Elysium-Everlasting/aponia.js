import type { Session, User } from '@auth/core/types'
import { parse } from 'cookie'

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

export interface NewSessionTokens {
  accessToken: Session
  refreshToken?: RefreshToken
}

export interface OldSessionTokens {
  accessToken?: Session | Nullish
  refreshToken: RefreshToken
}

/**
 * Internal session configuration.
 */
export interface SessionManagerConfig {
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
  createSession?: (user: User) => Awaitable<NewSessionTokens | Nullish>

  /**
   * Transform a session.
   */
  transformSession?: (session: Session) => Awaitable<Session | Nullish>

  /**
   * Given the info
   */
  handleRefresh?: (tokens: OldSessionTokens) => Awaitable<NewSessionTokens | Nullish>

  onInvalidateAccessToken?: (
    accessToken: Session,
    refreshToken: RefreshToken | Nullish,
  ) => Awaitable<InternalResponse | Nullish>
}

/**
 * Session user configuration.
 */
export type SessionMangerUserConfig = DeepPartial<SessionManagerConfig>

/**
 * Session manager.
 */
export class SessionManager {
  config: SessionManagerConfig

  constructor(config?: SessionMangerUserConfig) {
    const cookieOptions = createCookiesOptions(config?.createCookieOptions)

    cookieOptions.accessToken.options.maxAge ??= DEFAULT_ACCESS_TOKEN_AGE
    cookieOptions.refreshToken.options.maxAge ??= DEFAULT_REFRESH_TOKEN_AGE

    const secret = config?.secret || DEFAULT_SECRET

    // hkdf throws an error if it attempts to encrypt something with a key that's less than 1 character.
    // Might as well throw the error now instead of later during a request, where it's harder to debug.
    if (secret.length === 0) {
      throw new Error('The secret must be at least 1 character long')
    }

    this.config = {
      ...config,
      secret,
      pages: {
        logoutRedirect: DEFAULT_LOGOUT_REDIRECT,
        ...config?.pages,
      },
      jwt: {
        secret,
        encode,
        decode,
        ...config?.jwt,
      },
      cookieOptions,
    }
  }

  /**
   * Decode the JWT, encrypted access and refresh tokens.
   */
  async decodeTokens(tokens: { accessToken?: string; refreshToken?: string }) {
    const accessTokenData = await asPromise(
      this.config.jwt.decode<Session>({
        secret: this.config.secret,
        token: tokens.accessToken,
      }),
    ).catch((e) => {
      console.log('Error decoding access token', e)
    })

    const refreshTokenData = await asPromise(
      this.config.jwt.decode<RefreshToken>({
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
  async createCookies(newSession: NewSessionTokens): Promise<Cookie[]> {
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
  async getSessionFromRequest(request: InternalRequest): Promise<Session | Nullish> {
    const encodedAccessToken = request.cookies[this.config.cookieOptions.accessToken.name]

    const { accessTokenData: accessToken } = await this.decodeTokens({
      accessToken: encodedAccessToken,
    })

    if (!accessToken) {
      return null
    }

    const session = (await this.config.transformSession?.(accessToken)) ?? accessToken
    return session ?? null
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
      accessToken: {
        expires: refreshTokenData.expires,
        user: refreshTokenData.user,
      },
      refreshToken: {
        expires: refreshTokenData.expires,
        user: refreshTokenData.user,
      },
    }

    return {
      session: refreshedTokens?.accessToken,
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
export const createSessionManager = (config: SessionMangerUserConfig) => new SessionManager(config)
