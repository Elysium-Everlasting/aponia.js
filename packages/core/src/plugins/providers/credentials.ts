import type { RouteHandler } from '../../router'
import type { Awaitable, Nullish } from '../../utils/types'
import type { Plugin, PluginContext, PluginOptions } from '../plugin'

export interface CredentialsProviderConfig {
  login: RouteHandler
  signup: RouteHandler
}

export class CredentialsProvider implements Plugin {
  static type = 'credentials' as const

  type = CredentialsProvider.type

  /**
   * The originally provided configuration.
   */
  config: CredentialsProviderConfig

  constructor(config: CredentialsProviderConfig) {
    this.config = config
  }

  initialize(context: PluginContext, _options: PluginOptions): Awaitable<void> {
    context.router.post('/auth/login/credentials', this.login.bind(this))
    context.router.post('/auth/sign-up/credentials', this.signup.bind(this))
  }

  async login(request: Aponia.Request): Promise<Aponia.Response | Nullish> {
    const response = await this.config.login(request)
    return response
  }

  async signup(request: Aponia.Request): Promise<Aponia.Response | Nullish> {
    const response = await this.config.signup(request)
    return response
  }
}
