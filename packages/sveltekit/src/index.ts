import { Auth, type AuthConfig } from '@aponia.js/core/auth'
import type { Handle, RequestEvent } from '@sveltejs/kit'

export function eventToRequest(event: RequestEvent): Aponia.Request {
  const request: Aponia.Request = {
    url: event.url,
    method: event.request.method,
    headers: event.request.headers,
    cookies: event.cookies,
    event,
  }
  return request
}

export function sveltekit(authOrConfig: Auth | AuthConfig): Handle {
  const auth = 'router' in authOrConfig ? authOrConfig : new Auth(authOrConfig)

  const handle: Handle = async ({ event, resolve }) => {
    const request = eventToRequest(event)

    const authResponse = await auth.handle(request)

    const response = auth.toResponse(authResponse) ?? resolve(event)

    return response
  }

  return handle
}

export default sveltekit
