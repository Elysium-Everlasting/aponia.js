import '@aponia.js/core/types'
import type { Plugin, PluginContext, PluginOptions } from '@aponia.js/core/plugins/plugin'
import { PrismaClient } from '@prisma/client'

export class PrismaSessionPlugin implements Plugin {
  prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  initialize(context: PluginContext, _options: PluginOptions): void {
    context.router.postHandle(this.handle.bind(this))
  }

  async handle(_request: Aponia.Request, response?: Aponia.Response): Promise<void> {
    // Only perform account and session management if all of these properties are defined.
    if (
      response?.user == null ||
      response.providerId == null ||
      response.providerAccountId == null
    ) {
      return
    }

    // Find an account.
    this.findAccount(response)

    // If account doesn't exist, find user.
    this.findUser(response)

    // If user doesn't exist, create user.
    this.createUser(response)

    // If user exists, check existing accounts.
    this.findUserAccounts(response)

    // If no existing accounts, create a new account and link it with the user.
    this.createAccount(response)

    // If existing account, require user to sign in with existing account.
    // throw new Error('An account already exists with the same email address.')

    // After valid account is found, create a session.
    this.createSession(response)
  }

  /**
   * Find an existing account.
   */
  findAccount(...args: any): void {
    this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: args.providerId,
          providerAccountId: args.providerAccountId,
        },
      },
    })
  }

  /**
   * Given an existing account, find the user that owns the account.
   */
  findUser(...args: any): void {
    this.prisma.user.findUnique({
      where: args.user,
    })
  }

  /**
   * Create a new user.
   */
  createUser(...args: any): void {
    this.prisma.user.create({
      data: args.user,
    })
  }

  /**
   * Find all accounts linked to a user.
   */
  findUserAccounts(...args: any): void {
    this.prisma.account.findMany({
      where: {
        user: args.user,
      },
    })
  }

  /**
   * Create a new account and link it with a user.
   */
  createAccount(...args: any): void {
    this.prisma.account.create({
      data: {
        user: args.user,
        provider: args.providerId,
        providerAccountId: args.providerAccountId,
      },
    })
  }

  /**
   * Link an existing account with a user.
   */
  linkAccount(...args: any): void {
    this.prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: args.providerId,
          providerAccountId: args.providerAccountId,
        },
      },
      data: {
        user: args.user,
      },
    })
  }

  /**
   * Unlink an existing account from a user.
   */
  unlinkAccount(...args: any): void {
    this.prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: args.providerId,
          providerAccountId: args.providerAccountId,
        },
      },
      data: {
        user: null,
      },
    })
  }

  /**
   * Create a new session.
   */
  createSession(...args: any): void {
    this.prisma.session.create({
      data: {
        user: args.user,
        expires: args.expires,
      },
    })
  }

  /**
   * Update an existing session.
   */
  renewSession(...args: any): void {
    this.prisma.session.update({
      where: {
        id: args.sessionId,
      },
      data: {
        expires: args.expires,
      },
    })
  }

  /**
   * Invalidate an existing session.
   */
  invalidateSession(...args: any): void {
    this.prisma.session.delete({
      where: {
        id: args.sessionId,
      },
    })
  }

  /**
   * Get session information.
   */
  getSessionInformation(...args: any): void {
    this.prisma.session.findUnique({
      where: {
        id: args.sessionId,
        expires: {
          gt: args.expires,
        },
      },
      include: {
        user: true,
      },
    })
  }
}
