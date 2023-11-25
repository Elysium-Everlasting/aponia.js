import { Auth } from '@aponia.js/core'

type PsuedoPrismaClient = { $transaction: (...args: any) => any } & { [K: string]: any }

/**
 * Description of the default tables.
 */
export const DEFAULT_TABLE_MAPPINGS = {
  /**
   * The User table contains the user's information.
   * A user is the most atomic entity in the authentication system.
   * Each individual user will have one entry in this table.
   */
  user: {
    /**
     * Table name.
     */
    name: 'user',

    findUnique: 'id',

    delete: 'id',
  },

  /**
   * A user can have multiple accounts.
   * Each account provides a different way to authenticate the user.
   * Accounts are associated with a provider, which performs the actual authentication.
   */
  account: {
    /**
     * Table name.
     */
    name: 'account',

    delete: 'id',

    findUnique: {
      combinationKey: 'provider_providerAccountId',
      provider: 'provider',
      providerAccountId: 'providerAccountId',
      userId: 'user_id',
    },

    findMany: 'userId',

    deleteMany: 'user_id',
  },

  /**
   * Each session represents a user's authenticated session.
   * Users can have multiple sessions simultaneously.
   * A user can obtain a session by successfully authenticating through one of their accounts.
   */
  session: {
    /**
     * Table name.
     */
    name: 'session',

    findUnique: 'id',

    findMany: 'user_id',

    delete: 'id',

    deleteMany: 'user_id',
  },
} as const

export type DefaultTableMappings = typeof DEFAULT_TABLE_MAPPINGS

/**
 * A custom table mapping can be provided to the Prisma adapter.
 */
export type TableMappings = { [K in keyof DefaultTableMappings]: DefaultTableMappings[K] }

/**
 * Options to configure the adapter.
 */
export type PrismaAdapterOptions<T extends TableMappings = DefaultTableMappings> = {
  /**
   * Mappings.
   */
  mappings?: T
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
      ...options,
    }

    this.auth.providers.forEach((provider) => {
      if (provider.type === 'email' || provider.type === 'credentials') {
        return
      }

      provider.config.onAuth ??= async (user: any, tokens: any) => {
        const profile = (await provider.config.profile?.(user, tokens)) ?? user

        profile.id ??= profile.sub

        const existingAccount = await prisma[this.options.mappings.account.name].findUnique({
          where: {
            [this.options.mappings.account.findUnique.combinationKey]: {
              [this.options.mappings.account.findUnique.provider]: provider.type,
              [this.options.mappings.account.findUnique.providerAccountId]: profile.id,
            },
          },
        })

        if (existingAccount !== null) {
          return {
            user: existingAccount,

            // TODO: how to configure this behavior? It may seem unintuitive to redirect to the callback page?
            redirect: provider.config.pages.callback.redirect,
            status: 302,
          }
        }

        const existingUser = await prisma[this.options.mappings.user.name].findUnique({
          where: {
            [this.options.mappings.user.findUnique]: profile.id,
          },
        })

        if (existingUser !== null) {
          const newAccount = await prisma[this.options.mappings.account.name].create({
            data: {
              [this.options.mappings.account.findUnique.provider]: provider.type,
              [this.options.mappings.account.findUnique.providerAccountId]: profile.id,
              [this.options.mappings.account.findUnique.userId]:
                existingUser[this.options.mappings.user.findUnique],
            },
          })

          return {
            user: newAccount,
            // TODO: how to configure this behavior? It may seem unintuitive to redirect to the callback page?
            redirect: provider.config.pages.callback.redirect,
            status: 302,
          }
        }

        const newUser = await prisma[this.options.mappings.user.name].create({
          data: {
            [this.options.mappings.user.findUnique]: profile.id,
          },
        })

        const newAccount = await prisma[this.options.mappings.account.name].create({
          data: {
            [this.options.mappings.account.findUnique.provider]: provider.type,
            [this.options.mappings.account.findUnique.providerAccountId]: profile.id,
            [this.options.mappings.account.findUnique.userId]:
              newUser[this.options.mappings.user.findUnique],
          },
        })

        return {
          user: newAccount,

          // TODO: how to configure this behavior? It may seem unexpected to redirect to the callback page?
          redirect: provider.config.pages.callback.redirect,
          status: 302,
        }
      }
    })

    // this.auth.session.config.createSession ??= async (session) => {
    //   session
    // }

    // this.auth.session.config.onInvalidateAccessToken ??= async (accessToken, refreshToken) => { }
  }
}

export function adapt<T extends TableMappings = DefaultTableMappings>(
  auth: Auth,
  prisma: PsuedoPrismaClient,
  options: PrismaAdapterOptions<T> = {},
): Auth {
  new PrismaAdapter(auth, prisma, options)

  return auth
}
