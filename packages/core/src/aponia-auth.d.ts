import type * as oauth from 'oauth4webapi'

import type { InternalRequest, InternalResponse } from './types'
import type { Awaitable, Nullish } from './utils/types'

declare module '@auth/core/providers/oauth' {
  interface OAuth2Config<Profile> {
    onAuth?: (
      user: Profile,
      tokens: oauth.OAuth2TokenEndpointResponse | oauth.OpenIDTokenEndpointResponse,
      request: InternalRequest,
    ) => Awaitable<InternalResponse | Nullish>
  }
}
