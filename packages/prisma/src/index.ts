import '@aponia.js/core/types'
import type { Plugin, PluginContext, PluginOptions } from '@aponia.js/core/plugins/plugin'

export class PrismaSessionPlugin implements Plugin {
  constructor() {}

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

    // If account doesn't exist, find user.

    // If user doesn't exist, create user.

    // If user exists, check existing accounts.

    // If no existing accounts, create a new account and link it with the user.

    // If existing account, require user to sign in with existing account.

    // After valid account is found, create a session.
  }
}
