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

    id: 'id',
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

    id: 'id',

    providerProviderAccountId: 'provider_providerAccountId',

    provider: 'provider',

    providerAccountId: 'providerAccountId',

    userId: 'user_id',
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

    id: 'id',

    userId: 'user_id',
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
            [this.options.mappings.user.id]: profile.id,
          },
        })

        if (existingUser !== null) {
          const newAccount = await prisma[this.options.mappings.account.name].create({
            data: {
              [this.options.mappings.account.provider]: provider.type,
              [this.options.mappings.account.providerAccountId]: profile.id,
              [this.options.mappings.account.userId]: existingUser[this.options.mappings.user.id],
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
            [this.options.mappings.user.id]: profile.id,
          },
        })

        const newAccount = await prisma[this.options.mappings.account.name].create({
          data: {
            [this.options.mappings.account.provider]: provider.type,
            [this.options.mappings.account.providerAccountId]: profile.id,
            [this.options.mappings.account.userId]: newUser[this.options.mappings.user.id],
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
