import type { Awaitable, Session, User } from '@auth/core/types'

import type { Cookie } from '../security/cookie'
import type { InternalRequest, InternalResponse, RefreshToken } from '../types'
import type { Nullish } from '../utils/types'

import type { SessionController, SessionControllerConfig } from '.'

export interface DatabaseSessionControllerConfig extends SessionControllerConfig {
  createSession: (user: User) => Awaitable<Session>
  refreshSession: (session: Session) => Awaitable<Session>
  invalidateSession: (session: Session) => unknown

  createRefreshTokenFromSession?: (session: Session) => Awaitable<RefreshToken | Nullish>
  getSessionFromRefreshToken?: (refreshToken: RefreshToken) => Awaitable<Session | Nullish>
}

export class DatabaseSessionController implements SessionController {
  config: DatabaseSessionControllerConfig

  constructor(config: DatabaseSessionControllerConfig) {
    this.config = config
  }

  async handleRequest(_request: InternalRequest): Promise<InternalResponse | Nullish> {}

  async getSessionFromCookies(_cookies: Record<string, string>): Promise<Session | Nullish> {}

  async createCookiesFromSession(_session: Session): Promise<Cookie[]> {
    return []
  }

  async invalidateSession(_request: InternalRequest): Promise<InternalResponse> {
    return {}
  }
}
