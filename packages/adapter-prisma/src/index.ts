import { MiddlewareAuth, type MiddlwareAuthAdapter, type SessionTokens } from '@aponia.js/core'
import type { User, Session } from '@auth/core/types'

type PsuedoPrismaClient = { $transaction: (...args: any) => any } & Record<string, any>

export const DEFAULT_TABLE_MAPPINGS = {
  user: {
    name: 'user',
    id: 'id',
    email: 'email',
  },
  session: {
    name: 'session',
    id: 'id',
    userId: 'user_id',
    expires: 'expires',
  },
} as const

export type DefaultTableMappings = typeof DEFAULT_TABLE_MAPPINGS

export type TableMappings = { [K in keyof DefaultTableMappings]: DefaultTableMappings[K] }

export type PrismaAdapterOptions<T extends TableMappings = DefaultTableMappings> = {
  mappings?: T
  generateSessionToken?: () => string
  userToSession?: (user: User) => any | Promise<any>
  transformSession?: (session: Session, user: User) => SessionTokens | Promise<SessionTokens>
  getUserFromOldSession?: (session: SessionTokens) => any | Promise<any>
}

export type ResolvedPrismaAdapterOptions<T extends TableMappings = DefaultTableMappings> = Required<
  PrismaAdapterOptions<T>
>

export class PrismaAdapter<T extends TableMappings = DefaultTableMappings> {
  auth: MiddlewareAuth

  prisma: PsuedoPrismaClient

  options: ResolvedPrismaAdapterOptions<T>

  constructor(
    auth: MiddlewareAuth,
    prisma: PsuedoPrismaClient,
    options: PrismaAdapterOptions<T> = {},
  ) {
    this.auth = auth
    this.prisma = prisma
    this.options = {
      mappings: DEFAULT_TABLE_MAPPINGS as T,
      generateSessionToken: crypto.randomUUID,
      transformSession: async (session, user) => {
        const sessionData = { ...session, user }

        return {
          user,
          accessToken: sessionData,
          refreshToken: sessionData,
        }
      },
      userToSession: (user) => user,
      getUserFromOldSession: (session) => session.refreshToken,
      ...options,
    }

    this.auth.providers.forEach((provider) => {
      if (provider.type === 'email' || provider.type === 'credentials') {
        return
      }

      provider.config.onAuth ??= async (user: any, tokens: any) => {
        user
        tokens
      }
    })

    this.auth.session.config.createSession ??= async (user) => {
      user
    }

    this.auth.session.config.refreshTokens ??= async (tokens) => {
      tokens
    }

    this.auth.session.config.onInvalidate ??= async (tokens) => {
      tokens
    }
  }
}

/**
 * Adapts base {@link Auth} class to use Prisma by defining custom handlers on the providers and session manager.
 */
export function prismaAdapter<T extends TableMappings = DefaultTableMappings>(
  prisma: PsuedoPrismaClient,
  options: PrismaAdapterOptions<T> = {},
): MiddlwareAuthAdapter {
  return (auth) => {
    new PrismaAdapter(auth, prisma, options)
    return auth
  }
}

export default prismaAdapter
