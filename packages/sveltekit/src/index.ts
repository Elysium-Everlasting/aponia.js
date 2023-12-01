import {
  MiddlewareAuth,
  type AuthConfig,
  type InternalRequest as CoreInternalRequest,
  type InternalResponse,
} from '@aponia.js/core'
import type { Session } from '@auth/core/types'
import type { Handle, RequestEvent } from '@sveltejs/kit'
import { parse, serialize } from 'cookie'

const DEFAULT_LOCALS_SESSION_KEY = 'getSession'

const DEFAULT_LOCALS_DEBUG_KEY = 'aponia-auth'

type Nullish = null | undefined | void

export interface InternalRequest extends Omit<RequestEvent, 'cookies'>, CoreInternalRequest {}

export interface SvelteKitAuthOptions {
  /**
   */
  localsGetSessionKey?: keyof App.Locals

  /**
   * Key to store the internally generated auth response in locals if debugging.
   */
  localsAuthKey?: keyof App.Locals

  /**
   * Whether to enable debugging.
   */
  debug?: boolean
}

// export type SvelteKitAuthCallback = (event: RequestEvent) => MiddlewareAuth | AuthConfig

function getBody(response: InternalResponse): BodyInit | null | undefined {
  if (response.body) {
    return JSON.stringify(response.body)
  }

  if (response.redirect) {
    return
  }

  if (response.error) {
    return response.error.message
  }

  return
}

function toInternalRequest(event: RequestEvent): InternalRequest {
  return { ...event, cookies: parse(event.request.headers.get('cookie') ?? '') }
}

function createResponse(internalResponse: InternalResponse): Response {
  const body = getBody(internalResponse)
  const headers = new Headers()

  internalResponse.cookies?.forEach((cookie) => {
    headers.append('Set-Cookie', serialize(cookie.name, cookie.value, cookie.options))
  })

  if (internalResponse.redirect) {
    headers.set('Location', internalResponse.redirect)
  }

  const responseInit: ResponseInit = { status: internalResponse.status, headers }

  const response = new Response(body, responseInit)
  return response
}

export function createAuthHelpers(auth: MiddlewareAuth, options: SvelteKitAuthOptions = {}) {
  const localsSessionKey = options.localsGetSessionKey ?? DEFAULT_LOCALS_SESSION_KEY
  const localsDebugKey = options.localsAuthKey ?? DEFAULT_LOCALS_DEBUG_KEY

  const getSession = async (event: RequestEvent): Promise<Session | Nullish> => {
    const accessToken = event.cookies.get(auth.session.config.cookieOptions.accessToken.name)

    const tokens = await auth.session.decodeRawTokens({ accessToken })

    if (!accessToken) {
      return
    }

    const session = (await auth.session.config.transformSession?.(tokens)) ?? tokens.accessToken

    return session
  }

  const handle: Handle = async ({ event, resolve }) => {
    const locals: any = event.locals

    const internalResponse = await auth.handle(toInternalRequest(event))

    let cachedSession: Session | Nullish

    locals[localsSessionKey] = async () => (cachedSession ??= await getSession(event))

    if (options.debug) {
      locals[localsDebugKey] = internalResponse
    }

    if (internalResponse?.redirect || internalResponse?.error || internalResponse?.body) {
      return createResponse(internalResponse)
    }

    internalResponse?.cookies?.forEach((cookie) => {
      event.cookies.set(cookie.name, cookie.value, cookie.options)
    })

    return await resolve(event)
  }

  return handle
}

export function SvelteKitAuth(sveltekitAuthConfig: MiddlewareAuth | AuthConfig): Handle {
  if (typeof sveltekitAuthConfig === 'function') {
    // TODO
  }

  if (sveltekitAuthConfig instanceof MiddlewareAuth) {
    return createAuthHelpers(sveltekitAuthConfig)
  }

  const auth = new MiddlewareAuth(sveltekitAuthConfig)

  return createAuthHelpers(auth)
}
