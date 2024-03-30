import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

import { auth } from '$lib/server/auth'

const authHandle: Handle = async ({ event, resolve }) => {
  const authResponse = await auth.handle({
    url: event.url,
    method: event.request.method,
    headers: event.request.headers,
    cookies: event.cookies,
  })

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
