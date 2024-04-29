import { Auth, type AuthConfig } from '@aponia.js/core/auth'
import type { Handle } from '@sveltejs/kit'

export function sveltekit(authOrConfig: Auth | AuthConfig): Handle {
  const auth = 'router' in authOrConfig ? authOrConfig : new Auth(authOrConfig)

  const handle: Handle = async ({ event, resolve }) => {
    const request: Aponia.RequestInput = {
      url: event.url,
      method: event.request.method,
      headers: event.request.headers,
      cookies: event.cookies,
      event,
    }

    const authResponse = await auth.handle(request)

    const response = auth.toResponse(authResponse) ?? resolve(event)

    return response
  }

  return handle
}

export default sveltekit
