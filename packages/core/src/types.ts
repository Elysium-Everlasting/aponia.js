import type { OAuthConfig, OIDCConfig } from '@auth/core/providers/oauth'
import type { Session } from '@auth/core/types'

import type { Cookie } from './security/cookie'
import type { Nullish } from './utils/types'

export interface InternalRequest {
  request: Request
  url: URL
  cookies: Record<string, string>
}

export interface InternalResponse {
  session?: Session | Nullish
  status?: number
  redirect?: string
  cookies?: Cookie[]
  error?: Error
  body?: unknown
}

export interface RefreshToken extends Session {}

export interface PageEndpoint {
  route: string
  methods: string[]
  redirect?: string
}

export type ProviderPages = {
  login: PageEndpoint
  callback: PageEndpoint
}

export type Check = OAuthConfig<any>['checks'] | OIDCConfig<any>['checks']
