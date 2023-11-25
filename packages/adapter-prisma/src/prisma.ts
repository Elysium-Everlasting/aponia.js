import { Auth } from '@aponia.js/core'

/**
 * The minimum description of a table.
 */
export type Table = {
  /**
   * The name of the table.
   */
  name: string
} & Record<string, string>

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

    /**
     * Name of column for the account's unique identifier.
     */
    id: 'id',

    /**
     * Name of foreign key to the User table.
     */
    userId: 'userId',

    /**
     * Name of column for the provider type.
     */
    provider: 'provider',

    /**
     * Name of column for the provider's account ID.
     *
     * i.e. The ID that the provider recognizes the account as.
     */
    providerAccountId: 'providerAccountId',
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

    /**
     * Name of column for the session's unique identifier.
     */
    id: 'id',

    /**
     * Name of the foreign key to the User table.
     */
    userId: 'userId',

    /**
     * Name of column for the session's access token expiry date.
     */
    expires: 'expires',
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

export type MapTable<T extends Record<string, unknown>> = {
  [K in keyof T as T[K] extends Table ? T[K]['name'] : never]: T[K]
}

export type PrismaTable<T> = {
  findMany: T
}

/**
 * Attempts to parse the Prisma mapping.
 */
export type ParsePrismaClient<
  T extends TableMappings = DefaultTableMappings,
  TMappedTables extends MapTable<T> = MapTable<T>,
> = {
  mappedTables: TMappedTables
  tableNames: keyof TMappedTables
}

export type PrismaClient<
  T extends TableMappings = DefaultTableMappings,
  TParsed extends ParsePrismaClient<T> = ParsePrismaClient<T>,
> = {
  [K in keyof TParsed['mappedTables']]: PrismaTable<TParsed['mappedTables'][K]>
}

export class PrismaAdapter<T extends TableMappings = DefaultTableMappings> {
  auth: Auth

  prisma: PrismaClient<T>

  options: PrismaAdapterOptions

  constructor(auth: Auth, prisma: PrismaClient<T>, options: PrismaAdapterOptions<T> = {}) {
    this.auth = auth
    this.prisma = prisma
    this.options = options

    this.auth.providers.forEach((provider) => {
      if (provider.type === 'email' || provider.type === 'credentials') {
        return
      }

      provider.config.onAuth ??= async (user: any, tokens: any) => {
        const profile = await provider.config.profile?.(user, tokens)

        if (profile == null) {
          return
        }

        this.prisma
      }
    })

    // this.auth.session.config.createSession ??= async (session) => {
    //   session
    // }

    // this.auth.session.config.onInvalidateAccessToken ??= async (accessToken, refreshToken) => { }
  }
}
