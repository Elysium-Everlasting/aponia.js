import '@aponia.js/core/types'
import type { Plugin, PluginContext, PluginOptions } from '@aponia.js/core/plugins/plugin'

import type { DatabaseAdapter, DatabaseRefreshAdapter } from './types'

export class DatabasePlugin implements Plugin {
  adapter: DatabaseAdapter

  refresh?: DatabaseRefreshAdapter

  constructor(adapter: DatabaseAdapter, refresh?: DatabaseRefreshAdapter) {
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
