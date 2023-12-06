import {
  DEFAULT_CALLBACK_REDIRECT,
  DEFAULT_CALLBACK_ROUTE,
  // DEFAULT_CHECKS,
  DEFAULT_LOGIN_ROUTE,
} from '@aponia.js/core/constants'
import {
  OAuthProvider as CoreOAuthProvider,
  type OAuthProviderConfig,
} from '@aponia.js/core/providers/oauth'
import type { OAuthConfig, OAuthUserConfig } from '@auth/core/providers/oauth'

export class OAuthProvider<T> extends CoreOAuthProvider<T> {
  /**
   * Auth.js OAuth config.
   */
  authConfig: OAuthConfig<T>

  constructor(config: OAuthConfig<T> & { options?: OAuthUserConfig<T> }) {
    const id = config.id ?? config.options?.id ?? ''
    const clientId = config.clientId ?? config.options?.clientId ?? ''
    const clientSecret = config.clientSecret ?? config.options?.clientSecret ?? ''
    const token = config.token ?? config.options?.token ?? {}
    const userinfo = config.userinfo ?? config.options?.userinfo ?? {}

    // const checks: any = config.checks ?? config.options?.checks ?? DEFAULT_CHECKS

    const coreConfig: OAuthProviderConfig<T> = {
      ...config,
      ...config.options,
      id,
      clientId,
      clientSecret,
      client: {
        ...config.client,
        ...config.options?.client,
        client_id: clientId,
        client_secret: clientSecret,
      },
      pages: {
        login: `${DEFAULT_LOGIN_ROUTE}/${id}`,
        callback: `${DEFAULT_CALLBACK_ROUTE}/${id}`,
        redirect: DEFAULT_CALLBACK_REDIRECT,
      },
      endpoints: {
        authorization: {
          ...config.authorization,
          ...config.options?.authorization,
          params: {
            client_id: clientId,
            response_type: 'code',
            ...config.authorization?.params,
            ...config.options?.authorization?.params,
          },
        },
        token: typeof token === 'string' ? { url: token } : token,
        userinfo: typeof userinfo === 'string' ? { url: userinfo } : userinfo,
      },
    }

    super(coreConfig)

    this.authConfig = config
  }
}
