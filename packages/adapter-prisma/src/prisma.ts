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

export type MapTable<T extends Record<string, unknown>> = {
  [K in keyof T as T[K] extends Table ? T[K]['name'] : never]: T[K]
}

export type PrismaTable<T> = {
  findUnique: HasKey<T, 'findUnique'> extends true ? string : never
  findMany: HasKey<T, 'findMany'> extends true ? string : never
  delete: HasKey<T, 'delete'> extends true ? string : never
  deleteMany: HasKey<T, 'deleteMany'> extends true ? string : never
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
  [K in keyof TParsed['mappedTables']]: TrimNever<PrismaTable<TParsed['mappedTables'][K]>>
}

export class PrismaAdapter<T extends TableMappings = DefaultTableMappings> {
  auth: Auth

  prisma: PrismaClient<T>

  options: ResolvedPrismaAdapterOptions<T>

  constructor(auth: Auth, prisma: PrismaClient<T>, options: PrismaAdapterOptions<T> = {}) {
    this.auth = auth
    this.prisma = prisma
    this.options = options as any

    this.auth.providers.forEach((provider) => {
      if (provider.type === 'email' || provider.type === 'credentials') {
        return
      }

      provider.config.onAuth ??= async (user: any, tokens: any) => {
        const profile = await provider.config.profile?.(user, tokens)

        if (profile == null) {
          return
        }

        const k = this.options.mappings.user.name as keyof PrismaClient<T>

        const n = this.prisma[k]

        if ('findMany' in n) {
          n.findMany
        }
      }
    })

    // this.auth.session.config.createSession ??= async (session) => {
    //   session
    // }

    // this.auth.session.config.onInvalidateAccessToken ??= async (accessToken, refreshToken) => { }
  }
}

export type HasKey<T, K> = K extends keyof T ? true : false
export type TrimNever<T> = Pick<T, { [K in keyof T]: T[K] extends never ? never : K }[keyof T]>
