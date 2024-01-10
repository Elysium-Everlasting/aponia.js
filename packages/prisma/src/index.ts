import '@aponia.js/core/types'
import type { Plugin, PluginContext, PluginOptions } from '@aponia.js/core/plugins/plugin'

export class PrismaSessionPlugin implements Plugin {
  constructor() {}

  initialize(context: PluginContext, options: PluginOptions): void {
    context
    options
    context.router.postHandle(this.handle.bind(this))
  }

  async handle(_request: Aponia.Request, response?: Aponia.Response): Promise<void> {
    // Only perform account and session management if all of these properties are defined.
    if (
      response?.user == null ||
      response.providerId == null ||
      response.providerType == null ||
      response.providerAccountId == null
    ) {
      return
    }
  }
}
