import {
  MiddlewareAuth,
  type MiddlwareAuthAdapter,
  type InternalRequest,
  type RefreshToken,
} from '@aponia.js/core'
import type { Nullish } from '@aponia.js/core/utils/types'
import type { Account, Awaitable, Session, User } from '@auth/core/types'
import type * as oauth from 'oauth4webapi'

export type PsuedoPrismaClient = { $transaction: (...args: any) => any } & Record<string, any>

export type PrismaAdapterConfig = {
  findAccount: (
    profile: any,
    tokens: oauth.OAuth2TokenEndpointResponse | oauth.OpenIDTokenEndpointResponse,
    request: InternalRequest,
  ) => Awaitable<Account | Nullish>
  linkAccount: (
    profile: any,
    tokens: oauth.OAuth2TokenEndpointResponse | oauth.OpenIDTokenEndpointResponse,
    request: InternalRequest,
    session: Session,
  ) => Awaitable<Account>
  getUserFromAccount: (account: Account) => Awaitable<User>
  createSession: (user: User) => Awaitable<Session>
  findSessionFromRefreshToken: (refreshToken: RefreshToken) => Awaitable<Session | Nullish>
  refreshSession: (session: Session) => Awaitable<Session>
  invalidateSession: (session: Session) => unknown
}

export class PrismaAdapter {
  auth: MiddlewareAuth

  prisma: PsuedoPrismaClient

  config: PrismaAdapterConfig

  constructor(auth: MiddlewareAuth, prisma: PsuedoPrismaClient, config: PrismaAdapterConfig) {
    this.auth = auth
    this.prisma = prisma
    this.config = config

    this.auth.providers.forEach((provider) => {
      if (provider.type === 'email' || provider.type === 'credentials') {
        return
      }

      provider.config.onAuth ??= async (profile, tokens, request) => {
        const session = await this.auth.session.getSessionFromRequest(request)

        if (session == null) {
          const account = await this.config.findAccount(profile, tokens, request)

          if (account != null) {
            const user = await this.config.getUserFromAccount(account)
            const newSession = await this.config.createSession(user)
            return { session: newSession }
          }

          throw new Error('Please login with the initial account you created')
        }

        const existingAccount = await this.config.findAccount(profile, tokens, request)

        if (existingAccount != null) {
          const user = await this.config.getUserFromAccount(existingAccount)
          const newSession = await this.config.createSession(user)
          return { session: newSession }
        }

        const newAccount = await this.config.linkAccount(profile, tokens, request, session)

        const user = await this.config.getUserFromAccount(newAccount)
        const newSession = await this.config.createSession(user)
        return { session: newSession }
      }
    })

    this.auth.session.config.createSessionTokens ??= async (session) => {
      return {
        accessToken: session,
        refreshToken: { id: session.refreshToken },
      }
    }

    this.auth.session.config.refreshTokens ??= async (tokens) => {
      if (tokens.refreshToken == null) {
        return
      }

      const session = this.config.findSessionFromRefreshToken(tokens.refreshToken) as Session

      const newSession = await this.config.refreshSession(session)

      return {
        accessToken: newSession,
        refreshToken: { id: newSession.refreshToken },
      }
    }

    this.auth.session.config.onInvalidate ??= async (tokens) => {
      if (tokens.refreshToken == null) {
        return
      }

      const session = this.config.findSessionFromRefreshToken(tokens.refreshToken) as Session

      await this.config.invalidateSession(session)
    }
  }
}

export function prismaAdapter(
  prisma: PsuedoPrismaClient,
  config: PrismaAdapterConfig,
): MiddlwareAuthAdapter {
  return (auth) => {
    new PrismaAdapter(auth, prisma, config)
    return auth
  }
}
