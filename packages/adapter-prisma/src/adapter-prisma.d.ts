import type { AnyResolvedOauthProvider, InternalRequest } from '@aponia.js/core'
import type { User } from '@auth/core/types'
import type * as oauth from 'oauth4webapi'

declare module '@auth/core/providers/oauth' {
  interface OAuth2Config<Profile> {
    /**
     * Determines if the provider ID and provider account ID is a valid combination to authenticate a user.
     *
     * A combination is invalid if the user has registered with a different provider.
     * i.e. The user does not have an existing session, and wants to login with a different provider.
     * The user must acquire a session by logging in with the provider they initially registered with,
     * then link the new provider to their account by logging in with the new provider while the session is active.
     *
     * A combination is valid if:
     * - The user has no existing accounts -> create a new account.
     * - The provider ID and provider account ID pair exist -> use the existing account.
     * - The user is currently logged in and the provider ID and provider account ID don't exist -> link the account to the user.
     *
     * @returns boolean indicating if the combination is valid, or a user object if valid and associated user was found.
     *
     * If a {@link User} object is returned, then it's returned and no more processing is done.
     *
     * If `true` is returned:
     * 1. Look up the account by provider ID and provider account ID.
     * 2. If the account exists, return the associated user.
     * 3. If the account does not exist, create a new account and return the associated user.
     */
    handleAccount: (
      profile: Profile,
      tokens: oauth.OAuth2TokenEndpointResponse | oauth.OpenIDTokenEndpointResponse,
      provider: AnyResolvedOauthProvider,
      request: InternalRequest,
    ) => Promise<boolean | User>
  }
}
