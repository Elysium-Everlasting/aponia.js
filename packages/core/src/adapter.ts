import './types'

import type { Plugin, PluginContext, PluginOptions } from './plugins/plugin'
import type { Awaitable, Nullish } from './utils/types'

export type AuthenticatedResponse = Required<
  Pick<Aponia.Response, 'providerId' | 'providerType' | 'account'>
> &
  Omit<Aponia.Response, 'providerId' | 'providerType' | 'account'>

/**
 * Basic adapter for handling a standard authentication flow.
 */
export interface Adapter {
  /**
   * 1. A provider responds with a user's credentials.
   * 2. Find the corresponding account that was logged in to.
   */
  findAccount: (
    request: Aponia.Request,
    response: Aponia.AuthenticatedResponse,
  ) => Awaitable<Aponia.Account | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. No account was found.
   * 3. Find the user that owns the account.
   */
  getUserFromAccount: (
    account: Aponia.Account,
    request: Aponia.Request,
    response: Aponia.AuthenticatedResponse,
  ) => Awaitable<Aponia.User | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. An account is (eventually) found.
   * 3. A user that owns the account is (eventually) found.
   * 4. Create a new session.
   *
   * Accounts and users may be created/found in different ways.
   */
  createSession: (
    user: Aponia.User,
    account: Aponia.Account,
    request: Aponia.Request,
    response: Aponia.AuthenticatedResponse,
  ) => Awaitable<Aponia.Session | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. No account was found.
   * 3. Find a user that is associated with the credentials.
   */
  findUser: (
    request: Aponia.Request,
    response: Aponia.AuthenticatedResponse,
  ) => Awaitable<Aponia.User | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. No account was found.
   * 3. No user with the credentials is found.
   * 4. Create a new user.
   *
   * @remarks Do not create an account for the user too; this will be handled later.
   */
  createUser: (
    request: Aponia.Request,
    response: Aponia.AuthenticatedResponse,
  ) => Awaitable<Aponia.User | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. No account was found.
   * 3. A user with the credentials is found, or newly created with the credentials.
   * 4. Find all accounts that the user has.
   */
  findUserAccounts: (
    user: Aponia.User,
    request: Aponia.Request,
    response: Aponia.AuthenticatedResponse,
  ) => Awaitable<Aponia.Account[] | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. No account was found.
   * 3. A user with the credentials is found, or newly created with the credentials.
   * 4. Find all accounts that the user has.
   *
   * @default Throw error if multiple accounts are found.
   */
  handleMultipleAccounts?: (
    user: Aponia.User,
    account: Aponia.Account[],
    request: Aponia.Request,
    response: Aponia.AuthenticatedResponse,
  ) => Awaitable<Aponia.Account | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. No account was found.
   * 3. A user is either found or created.
   * 4. The found user doesn't have any accounts.
   * 5. Create a new account for the user.
   */
  createAccount: (
    user: Aponia.User,
    request: Aponia.Request,
    response: Aponia.AuthenticatedResponse,
  ) => Awaitable<Aponia.Account | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. An account was found.
   * 3. No user is found that owns the account.
   */
  handleUnboundAccount?: (
    account: Aponia.Account,
    request: Aponia.Request,
    response: Aponia.AuthenticatedResponse,
  ) => Awaitable<any>
}

/**
 * Supplemental adapter for refreshing sessions.
 * (PRE) indicates that the method is called before any provider handling.
 * (POST) indicates that the method is called after any provider handling.
 */
export interface RefreshAdapter {
  /**
   * (PRE)
   * Get the session from the request.
   */
  getSessionFromRequest: (request: Aponia.Request) => Awaitable<Aponia.Session | Nullish>

  /**
   * (PRE)
   * 1. No session is found in the request.
   * 2. Get the refresh token from the request.
   */
  getRefreshFromRequest: (request: Aponia.Request) => Awaitable<string | Nullish>

  /**
   * (PRE)
   * 1. No session is found in the request.
   * 2. Get the refresh token from the request.
   * 3. Decode the refresh token.
   */
  decodeRefresh: (refresh: string, request: Aponia.Request) => Awaitable<Aponia.Refresh | Nullish>

  /**
   * (PRE)
   * 1. No session is found in the request.
   * 2. Get the refresh token from the request.
   * 3. Decode the refresh token.
   * 4. Refresh the session.
   */
  renewSession: (
    refresh: Aponia.Refresh,
    request: Aponia.Request,
  ) => Awaitable<Aponia.Session | Nullish>

  /**
   * (POST)
   */
  createRefresh: (
    session: Aponia.Session,
    request: Aponia.Request,
    response: Aponia.AuthenticatedResponse,
  ) => Awaitable<Aponia.Refresh | Nullish>

  /**
   */
  encodeRefresh: (
    refresh: Aponia.Refresh,
    request: Aponia.Request,
    response: Aponia.AuthenticatedResponse,
  ) => Awaitable<string>
}

export interface AdapterPluginOptions extends PluginOptions {}

/**
 */
export class AdapterPlugin implements Plugin {
  adapter: Adapter

  options: AdapterPluginOptions

  constructor(adapter: Adapter, refresh?: RefreshAdapter, options: AdapterPluginOptions = {}) {
    this.adapter = adapter
    this.options = options
  }

  static isAuthenticatedResponse(
    response?: Aponia.Response,
  ): response is Aponia.AuthenticatedResponse {
    return (
      response?.providerId != null &&
      response.providerType != null &&
      response.account != null &&
      response.providerAccountId != null
    )
  }

  initialize(context: PluginContext, options: AdapterPluginOptions) {
    this.options = { ...this.options, ...options }
    context.router.postHandle(this.handle.bind(this))
  }

  async handle(request: Aponia.Request, response?: Aponia.Response) {
    if (!AdapterPlugin.isAuthenticatedResponse(response)) {
      return
    }

    let account = await this.adapter.findAccount(request, response)

    if (account != null) {
      const user = await this.adapter.getUserFromAccount(account, request, response)

      if (user == null) {
        return await this.adapter.handleUnboundAccount?.(account, request, response)
      }

      const session = await this.adapter.createSession(user, account, request, response)

      if (session != null) {
        response.session = session
      }

      return response
    }

    let user = await this.adapter.findUser(request, response)

    if (user == null) {
      user = await this.adapter.createUser(request, response)
    }

    if (user == null) {
      return
    }

    const accounts = await this.adapter.findUserAccounts(user, request, response)

    if (accounts?.length) {
      account = await this.handleMultipleAccounts(user, accounts, request, response)

      if (account == null) {
        return
      }
    }

    account = await this.adapter.createAccount(user, request, response)

    if (account == null) {
      return
    }

    const session = await this.adapter.createSession(user, account, request, response)

    if (session) {
      response.session = session
    }

    return response
  }

  handleMultipleAccounts(
    user: Aponia.User,
    accounts: Aponia.Account[],
    request: Aponia.Request,
    response: Aponia.AuthenticatedResponse,
  ): Awaitable<Aponia.Account | Nullish> {
    if (this.adapter.handleMultipleAccounts == null) {
      throw new Error('Multiple accounts found')
    }
    return this.adapter.handleMultipleAccounts(user, accounts, request, response)
  }
}

export function createAdapterPlugin(adapter: Adapter): Plugin {
  return new AdapterPlugin(adapter)
}
