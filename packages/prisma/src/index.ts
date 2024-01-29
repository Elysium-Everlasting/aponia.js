import '@aponia.js/core/types'
import type { Plugin, PluginContext, PluginOptions } from '@aponia.js/core/plugins/plugin'
import type { SessionPlugin } from '@aponia.js/core/plugins/session/index'
import { PrismaClient } from '@prisma/client'
import type { Nullish } from 'packages/core/src/utils/types'

export class PrismaSessionPlugin implements Plugin {
  prisma: PrismaClient

  session: SessionPlugin

  constructor(prisma: PrismaClient, session: SessionPlugin) {
    this.prisma = prisma
    this.session = session
  }

  initialize(context: PluginContext, _options: PluginOptions): void {
    context.router.postHandle(this.handle.bind(this))
  }

  async handle(_request: Aponia.Request, response?: Aponia.Response): Promise<void> {
    if (
      response?.account == null ||
      response.providerId == null ||
      response.providerAccountId == null
    ) {
      return
    }

    const matchingAccount = await this.findAccount(response)

    if (matchingAccount != null) {
      const user = this.getUserFromAccount(matchingAccount, response)
      if (user == null) {
        throw new Error('This account is not linked to a user.')
      }
      return this.createSession(user, matchingAccount, response)
    }

    const existingUser = this.findUser(response)

    if (existingUser == null) {
      const newUser = this.createUser(response)
      const newAccount = this.createAccount(newUser, response)
      return this.createSession(newUser, newAccount, response)
    }

    const existingAccounts = await this.findUserAccounts(response)

    if (existingAccounts.length > 0) {
      throw new Error('Please sign in with an existing account.')
    }

    const newAccount = this.createAccount(existingUser, response)
    return this.createSession(existingUser, newAccount, response)
  }

  async findAccount(response: Aponia.Response): Promise<Aponia.Account | Nullish> {
    return await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: response.providerId ?? '',
          providerAccountId: response.providerAccountId ?? '',
        },
      },
    })
  }

  /**
   * Given an existing account, find the user that owns the account.
   * If a user exists, then it can be used to create a new session.
   */
  findUser(...args: any): any {
    return this.prisma.user.findUnique({
      where: args.user,
    })
  }

  /**
   * Create a new user.
   */
  createUser(...args: any): any {
    return this.prisma.user.create({
      data: args.user,
    })
  }

  /**
   * Find all accounts linked to a user.
   * If no accounts exist, then a new account can be created and linked to the user.
   * If an account exists, then the user must sign in with the existing account before linking a new account with their user.
   */
  async findUserAccounts(...args: any): Promise<any[]> {
    return this.prisma.account.findMany({
      where: {
        user: args.user,
      },
    })
  }

  /**
   * Create a new account and link it with a user.
   */
  createAccount(...args: any): any {
    return this.prisma.account.create({
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
  linkAccount(...args: any): any {
    return this.prisma.account.update({
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
  unlinkAccount(...args: any): any {
    return this.prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: args.providerId,
          providerAccountId: args.providerAccountId,
        },
      },
      data: {},
    })
  }

  async handleSession(request: Aponia.Request): Promise<void> {
    // Check if session is expired.
    // 1. parse a session string from headers or cookies.
    // 2. Run decode function
    // It should either parse the string into some JSON value,
    // or search for a session in the database, or some combination of both.
    //
    // if session is expired, try renewing it or making a new one.
    // if session is not expired, then decode it.
    const sessionString = await this.getSessionFromRequest(request)
    const s = this.decodeSession(sessionString, request)

    if (s == null) {
      const refresh = await this.getRefreshFromRequest(request)
      this.refreshSession(refresh, request)
    }
  }

  async decodeSession(sessionString: string | undefined, request: Aponia.Request): Promise<any> {
    sessionString
    request
    return
  }

  async refreshSession(refresh: string | undefined, request: Aponia.Request): Promise<void> {
    refresh
    request
    return
  }

  /**
   * Create a new session.
   */
  async createSession(
    user: Aponia.User,
    _account: Aponia.Account,
    response: Aponia.Response,
  ): Promise<any> {
    const session = this.prisma.session.create({
      data: {
        userId: '',
        expires: new Date(),
        ...user,
      },
    })

    const sessionCookie = await this.session.createCookiesFromSession(session)

    response.cookies ??= []
    response.cookies.push(...sessionCookie)
  }

  async getSessionFromRequest(request: Aponia.Request): Promise<string | undefined> {
    return request.cookies['session']
  }

  async getRefreshFromRequest(request: Aponia.Request): Promise<string | undefined> {
    return request.cookies['refresh']
  }

  /**
   * Update an existing session.
   */
  renewSession(...args: any): any {
    return this.prisma.session.update({
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
  invalidateSession(...args: any): any {
    return this.prisma.session.delete({
      where: {
        id: args.sessionId,
      },
    })
  }

  /**
   * Get session information.
   */
  getSessionInformation(...args: any): any {
    return this.prisma.session.findUnique({
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

  async getUserFromAccount(
    account: Aponia.Account,
    _response: Aponia.Response,
  ): Promise<Aponia.User | undefined> {
    return account
  }
}
