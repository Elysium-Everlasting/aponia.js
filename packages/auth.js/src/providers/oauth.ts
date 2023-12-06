import {
  OAuthProvider as CoreOAuthProvider,
  type OAuthProviderConfig,
} from '@aponia.js/core/providers/oauth'
import type { OAuthConfig } from '@auth/core/providers/oauth'

export class OAuthProvider<T> extends CoreOAuthProvider<T> {
  /**
   * Auth.js OAuth config.
   */
  authConfig: OAuthConfig<T>

  constructor(config: OAuthConfig<T>) {
    const coreConfig: OAuthProviderConfig<T> = {
      id: config.id,
      clientId: config.clientId ?? config.client?.client_id ?? '',
    }

    super(coreConfig)

    this.authConfig = config
  }
}
