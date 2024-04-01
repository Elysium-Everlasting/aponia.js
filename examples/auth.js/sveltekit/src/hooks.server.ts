import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

import { auth } from '$lib/server/auth'

const authHandle: Handle = async ({ event, resolve }) => {
  const request: Aponia.RequestInput = {
    url: event.url,
    method: event.request.method,
    headers: event.request.headers,
    cookies: event.cookies,
    event,
  }

  const authResponse = await auth.handle(request)

  event.locals.getSession ??= authResponse?.getSession
  event.locals.getRefresh ??= authResponse?.getRefresh

  const response = auth.toResponse(authResponse) ?? resolve(event)

  return response
}

export const handle = sequence(authHandle)
