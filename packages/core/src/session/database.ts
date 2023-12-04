import type { Session } from '@auth/core/types'

import type { Cookie } from '../security/cookie'
import type { InternalRequest, InternalResponse } from '../types'
import type { Nullish } from '../utils/types'

import type { SessionController, SessionControllerConfig } from '.'

export interface DatabaseSessionControllerConfig extends SessionControllerConfig {}

export class DatabaseSessionController implements SessionController {
  config: DatabaseSessionControllerConfig

  constructor(config: DatabaseSessionControllerConfig) {
    this.config = config
  }

  async handleRequest(_request: InternalRequest): Promise<InternalResponse | Nullish> {}

  async getSessionFromCookies(_cookies: Record<string, string>): Promise<Session | Nullish> {
  }

  async createCookiesFromSession(_session: Session): Promise<Cookie[]> {
    return []
  }

  async invalidateSession(_request: InternalRequest): Promise<InternalResponse> {
    return {}
  }
}
