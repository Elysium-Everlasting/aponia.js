import { defu } from 'defu'

import type { Awaitable, DeepPartial, Nullish } from '../utils/types'

import type { ProviderPages } from './types'

/**
 * Internal configuration for the credentials provider.
 */
export interface CredentialsConfig {
  /**
   * Identifies
   */
  id: string
  onLogin?: (
    internalRequest: Aponia.InternalRequest,
  ) => Awaitable<Aponia.InternalResponse | Nullish>
  onRegister?: (
    internalRequest: Aponia.InternalRequest,
  ) => Awaitable<Aponia.InternalResponse | Nullish>
  pages: ProviderPages
}

/**
 * User configuration for the credentials provider.
 */
export interface CredentialsUserConfig extends DeepPartial<CredentialsConfig> {}

/**
 * Credentials provider.
 */
export class CredentialsProvider {
  /**
   * Sets the provider __type__ for all instances.
   */
  static type = 'credentials' as const

  /**
   * Forwards the static provider __type__ to an instance's properties.
   */
  type = CredentialsProvider.type

  /**
   * Config.
   */
  config: CredentialsConfig

  constructor(config: CredentialsUserConfig) {
    const id = config.id ?? CredentialsProvider.type

    this.config = defu(config, {
      id,
      pages: {
        login: {
          route: `/auth/login/${id}`,
          methods: ['POST'],
        },
        callback: {
          route: `/auth/register/${id}`,
          methods: ['POST'],
          redirect: '/',
        },
      },
    })
  }

  setJwtOptions() {
    return this
  }

  setCookiesOptions() {
    return this
  }

  async login(request: Aponia.InternalRequest): Promise<Aponia.InternalResponse> {
    return (await this.config.onLogin?.(request)) ?? {}
  }

  async callback(request: Aponia.InternalRequest): Promise<Aponia.InternalResponse> {
    return (await this.config.onRegister?.(request)) ?? {}
  }
}

/**
 * Create a credentials provider.
 */
export const Credentials = (config: CredentialsUserConfig) => new CredentialsProvider(config)
