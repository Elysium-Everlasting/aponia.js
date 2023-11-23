import { defu } from 'defu'

import type { Awaitable, DeepPartial, Nullish } from '../utils/types'

import type { ProviderPages } from './types'

/**
 * Internal configuration for the credentials provider.
 */
export interface CredentialsConfig {
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
  id = 'credentials' as const

  config: CredentialsConfig

  constructor(config: CredentialsUserConfig) {
    this.config = defu(config, {
      pages: {
        login: {
          route: `/auth/login/${this.id}`,
          methods: ['POST'],
        },
        callback: {
          route: `/auth/register/${this.id}`,
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
