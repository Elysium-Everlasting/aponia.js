import { Auth } from '@aponia.js/core'
import type { NewSession, OldSession } from '@aponia.js/core/session'

import { fromDate } from './utils'

type PsuedoPrismaClient = { $transaction: (...args: any) => any } & Record<string, any>

export const DEFAULT_TABLE_MAPPINGS = {
  user: {
    name: 'user',
    id: 'id',
    email: 'email',
  },
  account: {
    name: 'account',
    id: 'id',
    providerProviderAccountId: 'provider_providerAccountId',
    provider: 'provider',
    providerAccountId: 'providerAccountId',
    user: 'user',
    userId: 'user_id',
  },
  session: {
    name: 'session',
    id: 'id',
    userId: 'user_id',
    expires: 'expires',
    user: 'user',
  },
} as const

export type DefaultTableMappings = typeof DEFAULT_TABLE_MAPPINGS

export type TableMappings = { [K in keyof DefaultTableMappings]: DefaultTableMappings[K] }

export type PrismaAdapterOptions<T extends TableMappings = DefaultTableMappings> = {
  mappings?: T
  generateSessionToken?: () => string
  userToSession?: (user: any) => any | Promise<any>
  transformSession?: (session: any) => NewSession | Promise<NewSession>
  getUserFromOldSession?: (session: OldSession) => any | Promise<any>
}

export type ResolvedPrismaAdapterOptions<T extends TableMappings = DefaultTableMappings> = Required<
  PrismaAdapterOptions<T>
>

export class PrismaAdapter<T extends TableMappings = DefaultTableMappings> {
  auth: Auth

  prisma: PsuedoPrismaClient

  options: ResolvedPrismaAdapterOptions<T>

  constructor(auth: Auth, prisma: PsuedoPrismaClient, options: PrismaAdapterOptions<T> = {}) {
    this.auth = auth
    this.prisma = prisma
    this.options = {
      mappings: DEFAULT_TABLE_MAPPINGS as T,
      generateSessionToken: () => crypto.randomUUID(),
      transformSession: (session) => ({
        user: session,
        accessToken: session,
        refreshToken: session,
      }),
      userToSession: (user) => user,
      getUserFromOldSession: (session) => session.refreshToken,
      ...options,
    }

    this.auth.providers.forEach((provider) => {
      if (provider.type === 'email' || provider.type === 'credentials') {
        return
      }

      provider.config.onAuth ??= async (user: any, tokens: any) => {
        const profile = (await provider.config.profile?.(user, tokens)) ?? {
          id: `${user.sub ?? user.id}`,
          name: user.name ?? user.nickname ?? user.preferred_username,
          email: user.email,
          image: user.picture,
        }

        const existingAccount = await prisma[this.options.mappings.account.name].findUnique({
          where: {
            [this.options.mappings.account.providerProviderAccountId]: {
              [this.options.mappings.account.provider]: provider.type,
              [this.options.mappings.account.providerAccountId]: profile.id,
            },
          },
          include: {
            [this.options.mappings.account.user]: true,
          },
        })

        if (existingAccount?.user != null) {
          return {
            user: existingAccount.user,
            redirect: provider.config.pages.callback.redirect,
            status: 302,
          }
        }

        const existingUser = await prisma[this.options.mappings.user.name].findUnique({
          where: {
            [this.options.mappings.user.email]: profile.email,
          },
        })

        if (existingUser != null) {
          return {
            error: new Error('An account with that email already exists.'),
          }
        }

        const newUser = await prisma[this.options.mappings.user.name].create({ data: profile })

        await prisma[this.options.mappings.account.name].create({
          data: {
            [this.options.mappings.account.provider]: provider.type,
            [this.options.mappings.account.providerAccountId]: profile.id,
            [this.options.mappings.account.userId]: newUser[this.options.mappings.user.id],
          },
        })

        return {
          user: newUser,
          redirect: provider.config.pages.callback.redirect,
          status: 302,
        }
      }
    })

    this.auth.session.config.createSession ??= async (user) => {
      const newSession = await prisma[this.options.mappings.session.name].create({
        data: {
          [this.options.mappings.session.id]: this.options.generateSessionToken(),
          [this.options.mappings.session.userId]: user[this.options.mappings.user.id],
          [this.options.mappings.session.expires]: fromDate(
            this.auth.session.config.cookieOptions.accessToken.options.maxAge,
          ),
        },
        include: {
          [this.options.mappings.session.user]: true,
        },
      })

      if (this.options.transformSession) {
        return await this.options.transformSession(newSession)
      }

      const sessionData = {
        ...newSession,
        id: newSession[this.options.mappings.session.user].id,
        name: newSession[this.options.mappings.session.user].name,
        email: newSession[this.options.mappings.session.user].email,
        image: newSession[this.options.mappings.session.user].image,
      }

      return {
        user: sessionData,
        accessToken: sessionData,
        refreshToken: sessionData,
      }
    }

    this.auth.session.config.handleRefresh ??= async (oldSession) => {
      const user = await this.options.getUserFromOldSession(oldSession)

      if (user == null) {
        return
      }

      const refreshedSession = await prisma[this.options.mappings.session.name].create({
        data: {
          [this.options.mappings.session.id]: this.options.generateSessionToken(),
          [this.options.mappings.session.userId]: user[this.options.mappings.session.userId],
          [this.options.mappings.session.expires]: fromDate(
            this.auth.session.config.cookieOptions.accessToken.options.maxAge,
          ),
        },
      })

      if (this.options.transformSession) {
        return await this.options.transformSession(refreshedSession)
      }

      return {
        user: refreshedSession,
        accessToken: refreshedSession,
        refreshToken: refreshedSession,
      }
    }

    // this.auth.session.config.onInvalidateAccessToken ??= async (accessToken, refreshToken) => { }
  }
}

/**
 * Adapts base {@link Auth} class to use Prisma by defining custom handlers on the providers and session manager.
 */
export function adapt<T extends TableMappings = DefaultTableMappings>(
  auth: Auth,
  prisma: PsuedoPrismaClient,
  options: PrismaAdapterOptions<T> = {},
): Auth {
  new PrismaAdapter(auth, prisma, options)

  return auth
}
