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
    if (
      response?.user == null ||
      response.providerId == null ||
      response.providerAccountId == null
    ) {
      return
    }

    const account = this.findAccount(response)

    if (account != null) {
      response.user = this.getUserFromAccount(account)
      return this.createSession(response)
    }

    const user = this.findUser(response)

    if (user == null) {
      response.user = this.createUser(response)
      this.createAccount(response)
      return this.createSession(response)
    }

    const existingAccounts = this.findUserAccounts(response)

    if (existingAccounts.length > 0) {
      throw new Error('Please sign in with an existing account.')
    }

    response.user = user
    this.createAccount(response)
    return this.createSession(response)
  }

  /**
   * Find an existing account.
   * If an account exists, then it can be used to find an existing user.
   */
  findAccount(...args: any): any {
    return this.prisma.account.findUnique({
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
   * If a user exists, then it can be used to create a new session.
   */
  findUser(...args: any): void {
    this.prisma.user.findUnique({
      where: args.user,
    })
  }

  /**
   * Create a new user.
   */
  createUser(...args: any): any {
    this.prisma.user.create({
      data: args.user,
    })
  }

  /**
   * Find all accounts linked to a user.
   * If no accounts exist, then a new account can be created and linked to the user.
   * If an account exists, then the user must sign in with the existing account before linking a new account with their user.
   */
  findUserAccounts(...args: any): any[] {
    return this.prisma.account.findMany({
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
   * The user can now sign in with this account, i.e. via that provider.
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
   * The user can no longer sign in with this account, i.e. via that provider.
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

  getUserFromAccount(...args: any): any {
    return args
  }
}
