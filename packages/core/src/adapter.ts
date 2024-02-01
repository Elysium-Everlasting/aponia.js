import type { Plugin, PluginContext, PluginOptions } from './plugins/plugin'
import './types'
import type { Awaitable, Nullish } from './utils/types'

/**
 */
export interface Adapter {
  /**
   */
  findAccount: (
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.Account | Nullish>

  /**
   */
  getUserFromAccount: (
    account: Aponia.Account,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.User | Nullish>

  /**
   */
  createSession: (
    user: Aponia.User,
    account: Aponia.Account,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<any>

  /**
   */
  findUser: (request: Aponia.Request, response: Aponia.Response) => Awaitable<Aponia.User | Nullish>

  /**
   */
  findUserAccounts: (
    user: Aponia.User,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.Account[]>

  /**
   */
  createUser: (request: Aponia.Request, response: Aponia.Response) => Awaitable<Aponia.User>

  /**
   */
  createAccount: (
    user: Aponia.User,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.Account>

  /**
   */
  handleUnlinkedAccount: (
    account: Aponia.Account,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<any>

  /**
   */
  handleMultipleAccount: (
    account: Aponia.Account[],
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<any>
}

/**
 */
export interface RefreshAdapter {
  /**
   */
  getSessionFromRequest: (request: Aponia.Request) => Awaitable<Aponia.Session | Nullish>

  /**
   */
  refreshSession: (
    session: Aponia.Session,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<any>

  /**
   */
  getRefreshFromRequest: (request: Aponia.Request) => Awaitable<string | Nullish>

  /**
   */
  encodeRefresh: (
    session: Aponia.Session,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<string>

  /**
   */
  decodeRefresh: (
    refresh: string,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.Session | Nullish>

  /**
   */
  renewSession: (
    session: Aponia.Session,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<any>
}

/**
 * An adapter is completely standalone. Convert it to a plugin to use with the framework.
 */
export class AdapterPlugin implements Plugin {
  adapter: Adapter

  refresh?: RefreshAdapter

  constructor(adapter: Adapter, refresh?: RefreshAdapter) {
    this.adapter = adapter
    this.refresh = refresh
  }

  initialize(context: PluginContext, _options: PluginOptions) {
    context.router.postHandle(this.handle.bind(this))
  }

  async handle(request: Aponia.Request, response?: Aponia.Response) {
    if (
      response?.providerId == null ||
      response.providerType == null ||
      response.providerAccountId == null
    ) {
      return
    }

    const account = await this.adapter.findAccount(request, response)

    if (account != null) {
      const user = await this.adapter.getUserFromAccount(account, request, response)
      if (user == null) {
        return await this.adapter.handleUnlinkedAccount(account, request, response)
      }
      return await this.adapter.createSession(user, account, request, response)
    }

    const user = await this.adapter.findUser(request, response)

    if (user == null) {
      return
    }

    const accounts = await this.adapter.findUserAccounts(user, request, response)

    if (accounts.length > 0) {
      return await this.adapter.handleMultipleAccount(accounts, request, response)
    }

    const newAccount = await this.adapter.createAccount(user, request, response)

    return await this.adapter.createSession(user, newAccount, request, response)
  }
}

export function createAdapterPlugin(adapter: Adapter): Plugin {
  return new AdapterPlugin(adapter)
}
