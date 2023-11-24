import './aponia-sveltekit.d'

import type { Auth } from '@aponia.js/core'
import type { Handle, RequestEvent } from '@sveltejs/kit'
import { parse, serialize } from 'cookie'

const defaultLocalsGetUserKey = 'getUser'

const defaultLocalsUserKey = 'user'

const defaultLocalsAuthKey = 'aponia-auth'

export type Options = {
  /**
   */
  localsGetUserKey?: keyof App.Locals

  /**
   * Key to store the user in locals.
   * User will only be defined if the session was refreshed or provider action occurred during the current request.
   */
  localsUserKey?: keyof App.Locals

  /**
   * Key to store the internally generated auth response in locals if debugging.
   */
  localsAuthKey?: keyof App.Locals

  /**
   * Whether to enable debugging.
   */
  debug?: boolean
}

function getBody(response: Aponia.InternalResponse): BodyInit | null | undefined {
  if (response.body) {
    return JSON.stringify(response.body)
  }

  if (response.redirect) {
    return null
  }

  if (response.error) {
    return response.error.message
  }

  return undefined
}

function createSetCookiesHeader(cookies: Aponia.InternalResponse['cookies']): string {
  return (
    cookies?.map((cookie) => serialize(cookie.name, cookie.value, cookie.options)).join('; ') ?? ''
  )
}

function createResponse(response: Aponia.InternalResponse): Response {
  const body = getBody(response)
  const headers: HeadersInit = {}

  if (response.cookies) {
    headers['set-cookie'] = createSetCookiesHeader(response.cookies)
  }

  if (response.redirect) {
    headers['location'] = response.redirect
  }

  const responseInit: ResponseInit = { status: response.status, headers }

  return new Response(body, responseInit)
}

export function toInternalRequest(event: RequestEvent): Aponia.InternalRequest {
  return { ...event, cookies: parse(event.request.headers.get('cookie') ?? '') }
}

export function createAuthHelpers(auth: Auth, options: Options = {}) {
  const localsGetUserKey = options.localsGetUserKey ?? defaultLocalsGetUserKey
  const localsUserKey = options.localsUserKey ?? defaultLocalsUserKey
  const localsAuthKey = options.localsAuthKey ?? defaultLocalsAuthKey

  const getUser = async (event: RequestEvent): Promise<Aponia.User | null> => {
    const initialUser = (event.locals as any)[localsUserKey]
    if (initialUser) return initialUser

    const accessToken = event.cookies.get(auth.session.config.cookieOptions.accessToken.name)

    const { accessTokenData } = await auth.session.decodeTokens({ accessToken })
    if (!accessTokenData) return null

    const user = await auth.session.config.getAccessTokenUser(accessTokenData)
    if (!user) return null

    return user
  }

  const handle: Handle = async ({ event, resolve }) => {
    const locals: any = event.locals

    const internalResponse = await auth.handle(toInternalRequest(event))

    let cachedUser: Aponia.User

    locals[localsUserKey] = internalResponse.user
    locals[localsGetUserKey] = () => (cachedUser ??= getUser(event))

    if (options.debug) {
      locals[localsAuthKey] = internalResponse
    }

    if (internalResponse.redirect || internalResponse.error || internalResponse.body) {
      return createResponse(internalResponse)
    }

    internalResponse.cookies?.forEach((cookie) => {
      event.cookies.set(cookie.name, cookie.value, cookie.options)
    })

    return await resolve(event)
  }

  return handle
}

export default createAuthHelpers
