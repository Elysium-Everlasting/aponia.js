// This is an ambient declaration file, so it can't do any exports. Or something.

type User = import('@auth/core/types').User

declare global {
  namespace Aponia {
    /**
     * The data stored in a JWT, encrypted access token, and then into a cookie.
     * Should be short-lived and contain minimal data needed to identify the user.
     * Refreshed with relevant data from a refresh token.
     *
     * @example session ID, user ID, etc.
     *
     * An access token can be the same as the user.
     * Or it may contain a session ID or user ID which is subsequently used to identify the user.
     */
    interface AccessToken extends User {}

    /**
     * Data that's used to refresh an access token.
     *
     * @example Session ID: Look up the session in the database, extend the expiration data, create tokens.
     * @example User ID: Look up the user in the database, create new tokens with new expiration dates.
     * @example User: Just create new tokens with new expiration dates.
     */
    interface RefreshToken extends User {}
  }
}

export {}
