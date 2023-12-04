import type { Session } from '@auth/core/types'

import type { Cookie } from '../security/cookie'
import type { InternalRequest, InternalResponse, RefreshToken } from '../types'
import type { Nullish } from '../utils/types'

export interface SessionTokens {
  accessToken?: Session | Nullish
  refreshToken?: RefreshToken | Nullish
}

export interface UnknownSessionTokens {
  accessToken?: Session | Nullish
  refreshToken?: RefreshToken | Nullish
}

export interface RawSessionTokens {
  accessToken?: string
  refreshToken?: string
}

export abstract class SessionController {
  abstract config: any

  abstract createCookiesFromSession(session: Session): Promise<Cookie[]>

  abstract getSessionFromCookies(cookies: Record<string, string>): Promise<Session | Nullish>

  abstract handleRequest(request: InternalRequest): Promise<InternalResponse | Nullish>

  abstract invalidateSession(request: InternalRequest): Promise<InternalResponse | Nullish>
}
