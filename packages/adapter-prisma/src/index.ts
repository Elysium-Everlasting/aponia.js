import { Auth } from '@aponia.js/core'
import type { NewSession, OldSession } from '@aponia.js/core/session'

type PsuedoPrismaClient = { $transaction: (...args: any) => any } & Record<string, any>

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

    user: 'user',

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

  /**
   * The default session manager doesn't need to identify each session with its own unique ID;
   * it only needs to encode the user data into the session token.
   *
   * Database sessions need to be connected with an entry in the database.
   */
  generateSessionToken?: () => string

  /**
   * Converts a user retrieved from an access token to a session of the same shape as the database.
   */
  userToSession?: (user: any) => any | Promise<any>

  /**
   */
  transformSession?: (session: any) => NewSession | Promise<NewSession>

  /**
   */
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

    // All providers are given a custom onAuth handler if they haven't already been defined.
    // The handler will interact with the database and return a __user__.
    // Immediately after the provider returns the __user__, the session manager will create a new __session__.

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

        // User attempted to login with an account, and the user entry was found.
        // This confirms that the existing account exists as well as the user it's mapped to.

        if (existingAccount?.user != null) {
          return {
            user: existingAccount.user,

            // TODO: how to configure this behavior? It may seem unintuitive to redirect to the callback page?
            redirect: provider.config.pages.callback.redirect,
            status: 302,
          }
        }

        // User attempted to login with an account, but the user entry was not found.
        // Since the verification was done by an external OAuth provider,
        // we'll trust them and create a new user and account under that provider.

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

          // TODO: how to configure this behavior? It may seem unexpected to redirect to the callback page?
          redirect: provider.config.pages.callback.redirect,
          status: 302,
        }
      }
    })

    // This callback should run immediately after the onAuth callback for the provider runs.
    // There's a layer of abstraction between these two functions
    // because all the providers are scanned to find the correct onAuth handler to actually execute.
    // Whereas the same session manager will always be used afterwards.

    this.auth.session.config.createSession ??= async (user) => {
      const newSession = await prisma[this.options.mappings.session.name].create({
        data: {
          [this.options.mappings.session.id]: this.options.generateSessionToken(),
          [this.options.mappings.session.userId]: user[this.options.mappings.user.id],
          [this.options.mappings.session.expires]: fromDate(
            this.auth.session.config.cookieOptions.accessToken.options.maxAge,
          ),
        },
      })

      if (this.options.transformSession) {
        return await this.options.transformSession(newSession)
      }

      return {
        user: newSession,
        accessToken: newSession,
        refreshToken: newSession,
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

/**
 * Takes a number in seconds and returns the date in the future.
 * Optionally takes a second date parameter. In that case
 * the date in the future will be calculated from that date instead of now.
 */
export function fromDate(time = 0, date = Date.now()) {
  return new Date(date + time * 1000)
}
