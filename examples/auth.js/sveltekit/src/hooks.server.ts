import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

import { auth } from '$lib/server/auth'

const authHandle: Handle = async ({ event, resolve }) => {
  auth.handle({
    url: event.url,
    method: event.request.method,
    headers: event.request.headers,
    cookies: event.cookies,
  })

  return await resolve(event)
}

export const handle = sequence(authHandle)
