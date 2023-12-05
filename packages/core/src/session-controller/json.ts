import type { Awaitable } from '../utils/types'

import type { SessionController, Tokens } from '.'

/**
 * DON'T USE THIS IN PRODUCTION.
 */
export class JsonSessionController implements SessionController {
  createSessionFromUser(user: Aponia.User): Awaitable<Aponia.Session | undefined> {
    return user
  }

  createTokensFromSession(session: Aponia.Session): Awaitable<Tokens | undefined> {
    return {
      accessToken: JSON.stringify(session),
    }
  }

  parseSessionFromTokens(tokens: Tokens): Awaitable<Aponia.Session | undefined> {
    return JSON.parse(tokens.accessToken ?? '')
  }
}
