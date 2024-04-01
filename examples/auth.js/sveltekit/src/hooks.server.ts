import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

import { auth, jwtSession } from '$lib/server/auth'

const authHandle: Handle = async ({ event, resolve }) => {
  const request: Aponia.RequestInput = {
    url: event.url,
    method: event.request.method,
    headers: event.request.headers,
    cookies: event.cookies,
  }

  const authResponse = await auth.handle(request)

  event.locals.getSession = async () => (await jwtSession.getSession(request)) ?? undefined
  event.locals.getRefresh = async () => (await jwtSession.getRefresh(request)) ?? undefined

  if (authResponse == null) {
    return await resolve(event)
  }

  const body = authResponse.body
    ? JSON.stringify(authResponse.body)
    : authResponse.error
    ? authResponse.error.message
    : undefined

  const headers = new Headers()

  authResponse.cookies?.forEach((cookie) => {
    headers.append(
      'Set-Cookie',
      event.cookies.serialize(cookie.name, cookie.value, { path: '/', ...cookie.options }),
    )
  })

  if (authResponse.redirect) {
    headers.set('Location', authResponse.redirect)
  }

  const responseInit: ResponseInit = { status: authResponse.status, headers }

  const response = new Response(body, responseInit)
  return response
}

export const handle = sequence(authHandle)
