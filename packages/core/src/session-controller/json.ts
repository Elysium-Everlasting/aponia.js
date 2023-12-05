import type { Awaitable, Nullish } from '../utils/types'

import type { SessionController, Tokens } from '.'

/**
 * DON'T USE THIS IN PRODUCTION.
 */
export class JsonSessionController implements SessionController {
  createSessionFromUser(user: Aponia.User): Awaitable<Aponia.Session | Nullish> {
    return user
  }

  createTokensFromSession(session: Aponia.Session): Awaitable<Tokens | Nullish> {
    return {
      accessToken: JSON.stringify(session),
    }
  }

  parseSessionFromTokens(tokens: Tokens): Awaitable<Aponia.Session | Nullish> {
    return JSON.parse(tokens.accessToken ?? '')
  }
}
