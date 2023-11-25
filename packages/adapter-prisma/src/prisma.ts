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

    findUnique: 'userId',

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

    findUnique: ['provider', 'accountProviderId'],

    findMany: 'userId',

    deleteMany: 'userId',
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

    findMany: 'userId',

    delete: 'id',

    deleteMany: 'userId',
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
        const profile = await provider.config.profile?.(user, tokens)

        if (profile == null) {
          return
        }

        const existingAccount = await prisma[this.options.mappings.account.name].findUnique({
          where: {
            [this.options.mappings.account.findUnique[0]]: provider.type,
            [this.options.mappings.account.findUnique[1]]: profile.id,
          },
        })

        if (existingAccount == null) {
          return {
            user: existingAccount,

            // TODO: how to configure this behavior? It may seem unintuitive to redirect to the callback page?
            redirect: provider.config.pages.callback.redirect,
            status: 302,
          }
        }

        const newAccount = await prisma[this.options.mappings.account.name].create({
          data: profile,
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
