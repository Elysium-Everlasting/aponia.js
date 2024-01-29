import '@aponia.js/core/types'
import type { Plugin, PluginContext } from '@aponia.js/core/plugins/plugin'
import type { Nullish } from 'packages/core/src/utils/types'

export class DatabasePlugin implements Plugin {
  initialize(context: PluginContext): void {
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
        return this.handleUnlinkedAccount()
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
      return this.handleDuplicateAccount()
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

  async encodeSession(session: Aponia.Session, _request: Aponia.Request): Promise<string> {
    return session as any
  }

  /**
   * Create a new session.
   */
  async createSession(
    user: Aponia.User,
    _account: Aponia.Account,
    _response: Aponia.Response,
  ): Promise<any> {
    return {
      session: user,
      refresh: {},
    }
  }

  async getUserFromAccount(
    account: Aponia.Account,
    _response: Aponia.Response,
  ): Promise<Aponia.User | undefined> {
    return account as any
  }

  async handleDuplicateAccount() {
    throw new Error('An account with the same email address already exists.')
  }

  async handleUnlinkedAccount() {
    throw new Error('An account with the same email address already exists.')
  }
}
