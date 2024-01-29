import '@aponia.js/core/types'
import type { Plugin, PluginContext, PluginOptions } from '@aponia.js/core/plugins/plugin'
import type { Nullish } from 'packages/core/src/utils/types'

export class DatabasePlugin implements Plugin {
  initialize(context: PluginContext, _options: PluginOptions): void {
    context.router.preHandle(this.handleSession.bind(this))
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
    return response as any
  }

  /**
   * Given an existing account, find the user that owns the account.
   * If a user exists, then it can be used to create a new session.
   */
  findUser(...args: any): any {
    return args
  }

  /**
   * Create a new user.
   */
  createUser(...args: any): any {
    return args
  }

  /**
   * Find all accounts linked to a user.
   * If no accounts exist, then a new account can be created and linked to the user.
   * If an account exists, then the user must sign in with the existing account before linking a new account with their user.
   */
  async findUserAccounts(...args: any): Promise<any[]> {
    return args as any
  }

  /**
   * Create a new account and link it with a user.
   */
  createAccount(...args: any): any {
    return args as any
  }

  /**
   * Link an existing account with a user.
   * The user can now sign in with this account, i.e. via that provider.
   */
  linkAccount(...args: any): any {
    return args as any
  }

  /**
   * Unlink an existing account from a user.
   * The user can no longer sign in with this account, i.e. via that provider.
   */
  unlinkAccount(...args: any): any {
    return args as any
  }

  /**
   * Handles refreshing a session if needed.
   *
   * 1. Try to locate the session string. This is a trivial operation.
   * 2. If the session string is not found, then try to locate the refresh string. This is a trivial operation.
   * 3. If the refresh string is found, then refresh the session. This is a non-trivial operation.
   *
   * This does **NOT** decode the session string since that's a non-trivial operation that should be done as-needed.
   */
  async handleSession(request: Aponia.Request): Promise<void> {
    const sessionString = await this.getSessionFromRequest(request)

    if (sessionString == null) {
      const refresh = await this.getRefreshFromRequest(request)
      this.refreshSession(refresh, request)
    }
  }

  /**
   * This isn't used during the handling lifecycle since database querying is non-trivial.
   * This is invoked on-demand whenever the session is needed.
   */
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
    _user: Aponia.User,
    _account: Aponia.Account,
    _response: Aponia.Response,
  ): Promise<any> {}

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
    return args as any
  }

  /**
   * Invalidate an existing session.
   */
  invalidateSession(...args: any): any {
    return args as any
  }

  async getUserFromAccount(
    account: Aponia.Account,
    _response: Aponia.Response,
  ): Promise<Aponia.User | undefined> {
    return account as any
  }
}
