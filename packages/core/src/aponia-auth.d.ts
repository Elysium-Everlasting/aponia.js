declare global {
  declare module '@auth/core/providers/oauth' {
    type OAuth2TokenEndpointResponse = import('oauth4webapi').OAuth2TokenEndpointResponse
    type Awaitable = import('./utils/types').Awaitable
    type InternalRequest = import('./types').InternalRequest
    type Nullish = import('./utils/types').Nullish

    interface OAuth2Config<Profile> {
      onAuth?: (
        user: Profile,
        tokens: OAuth2TokenEndpointResponse,
      ) => Awaitable<InternalRequest | Nullish>
    }
  }
}
