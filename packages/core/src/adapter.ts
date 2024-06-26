import './types'

import type { Plugin, PluginContext, PluginOptions } from './plugins/plugin'
import { parseCookie } from './security/cookie'
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
  findAccount?: (
    request: Aponia.Request,
    response: Aponia.AuthenticatedResponse,
  ) => Awaitable<Aponia.Account | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. No account was found.
   * 3. Find the user that owns the account.
   */
  getUserFromAccount?: (
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
  createSession?: (
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
  findUser?: (
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
  createUser?: (
    request: Aponia.Request,
    response: Aponia.AuthenticatedResponse,
  ) => Awaitable<Aponia.User | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. No account was found.
   * 3. A user with the credentials is found, or newly created with the credentials.
   * 4. Find all accounts that the user has.
   */
  findUserAccounts?: (
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
  createAccount?: (
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
 */
export interface AdapterPluginOptions extends PluginOptions {}

/**
 */
export class AdapterPlugin implements Plugin {
  adapter: Adapter

  options: AdapterPluginOptions

  constructor(adapter: Adapter, options: AdapterPluginOptions = {}) {
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

  async handle(
    request: Aponia.Request | Request,
    response?: Aponia.Response,
  ): Promise<Aponia.AuthenticatedResponse | undefined> {
    if (!AdapterPlugin.isAuthenticatedResponse(response)) {
      return
    }

    const internalRequest =
      request instanceof Request
        ? {
            url: new URL(request.url),
            method: request.method,
            cookies: parseCookie(request.headers.get('cookie')),
            headers: request.headers,
          }
        : request

    let account = await this.adapter.findAccount?.(internalRequest, response)

    if (account != null) {
      const user = await this.adapter.getUserFromAccount?.(account, internalRequest, response)

      if (user == null) {
        return await this.adapter.handleUnboundAccount?.(account, internalRequest, response)
      }

      const session = await this.adapter.createSession?.(user, account, internalRequest, response)

      if (session != null) {
        response.session = session
      }

      return response
    }

    let user = await this.adapter.findUser?.(internalRequest, response)

    if (user == null) {
      user = await this.adapter.createUser?.(internalRequest, response)
    }

    if (user == null) {
      return
    }

    const accounts = await this.adapter.findUserAccounts?.(user, internalRequest, response)

    if (accounts?.length) {
      account = await this.handleMultipleAccounts(user, accounts, internalRequest, response)

      if (account == null) {
        return
      }
    }

    account = await this.adapter.createAccount?.(user, internalRequest, response)

    if (account == null) {
      return
    }

    const session = await this.adapter.createSession?.(user, account, internalRequest, response)

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
