import type { Awaitable, Nullish } from '../utils/types'

/**
 * Tokens are shared as strings. e.g. session IDs, JWT-encoded objects, JSON-stringified objects, etc.
 */
export interface Tokens {
  accessToken?: string
  refreshToken?: string
}

/**
 * All session controllers need to implement this interface.
 */
export abstract class SessionController {
  /**
   * After a provider authenticates a user,
   * it returns an {@link Aponia.User}, which should be used to create a {@link Aponia.Session}.
   */
  abstract createSessionFromUser(user: Aponia.User): Awaitable<Aponia.Session | Nullish>

  /**
   * Whenever a new session is created by the framework,
   * it should be converted to a {@link Tokens} object and sent to the client.
   *
   * The middleware will decide how to send the tokens, e.g. in cookies, response body, etc.
   */
  abstract createTokensFromSession(session: Aponia.Session): Awaitable<Tokens | Nullish>

  /**
   * The client should include the tokens on subsequent requests;
   * the tokens should be parsed and converted to a {@link Aponia.Session} object.
   *
   * The middleware will decide where to get the tokens, e.g. cookies, Authorization header, etc.
   */
  abstract parseSessionFromTokens(tokens: Tokens): Awaitable<Aponia.Session | Nullish>
}
