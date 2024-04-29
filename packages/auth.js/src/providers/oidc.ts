import {
  DEFAULT_CALLBACK_REDIRECT,
  DEFAULT_CALLBACK_ROUTE,
  DEFAULT_LOGIN_ROUTE,
} from '@aponia.js/core/constants'
import {
  OIDCProvider as CoreOIDCProvider,
  type OIDCProviderConfig,
} from '@aponia.js/core/plugins/providers/oidc'
import type { OAuthConfig, OAuthUserConfig } from '@auth/core/providers/oauth'

export class OIDCProvider<T> extends CoreOIDCProvider<T> {
  authConfig: OAuthConfig<T>

  constructor(
    config: OAuthConfig<T> & { options?: OAuthUserConfig<T> },
    coreConfig?: OIDCProviderConfig<T>,
  ) {
    const id = coreConfig?.id ?? config.id ?? config.options?.id ?? ''
    const clientId = coreConfig?.clientId ?? config.clientId ?? config.options?.clientId ?? ''
    const clientSecret = config.clientSecret ?? config.options?.clientSecret ?? ''
    const token = coreConfig?.endpoints?.token ?? config.token ?? config.options?.token ?? {}
    const userinfo =
      coreConfig?.endpoints?.userinfo ?? config.userinfo ?? config.options?.userinfo ?? {}

    const resolvedConfig = {
      ...config,
      ...config.options,
      id,
      clientId,
      clientSecret,
      checker: {
        checks: config.checks,
        ...coreConfig?.checker,
      },
      client: {
        ...config.client,
        ...config.options?.client,
        ...coreConfig?.client,
        client_id: clientId,
        client_secret: clientSecret,
      },
      pages: {
        login: `${DEFAULT_LOGIN_ROUTE}/${id}`,
        callback: `${DEFAULT_CALLBACK_ROUTE}/${id}`,
        redirect: DEFAULT_CALLBACK_REDIRECT,
        ...coreConfig?.pages,
      },
      endpoints: {
        authorization: {
          ...config.authorization,
          ...config.options?.authorization,
          ...coreConfig?.endpoints?.authorization,
          params: {
            client_id: clientId,
            response_type: 'code',
            ...config.authorization?.params,
            ...config.options?.authorization?.params,
            ...coreConfig?.endpoints?.authorization?.params,
          },
        },
        token: typeof token === 'string' ? { url: token } : token,
        userinfo: typeof userinfo === 'string' ? { url: userinfo } : userinfo,
      },
    } as OIDCProviderConfig<T>

    super(resolvedConfig)

    this.authConfig = config
  }
}
