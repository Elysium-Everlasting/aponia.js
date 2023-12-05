export interface SessionControllerConfig {}

export interface Tokens {
  accessToken?: string
  refreshToken?: string
}

export class SessionController {
  constructor(public readonly config?: SessionControllerConfig) {}

  async createSessionFromUser(user: Aponia.User): Promise<Aponia.Session> {
    return user
  }

  async createTokensFromSession(session: Aponia.Session): Promise<Tokens> {
    return session
  }

  async parseSessionFromTokens(tokens: Tokens): Promise<Aponia.Session> {
    return tokens
  }
}

export function createSessionController(config?: SessionControllerConfig): SessionController {
  return new SessionController(config)
}
