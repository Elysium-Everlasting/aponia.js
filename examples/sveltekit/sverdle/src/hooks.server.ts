import '@aponia.js/core/types'

import { OAuthProvider } from '@aponia.js/auth.js/providers/oauth'
import { Auth } from '@aponia.js/core/auth'
import { JwtSessionController } from '@aponia.js/core/controllers/jwt-session'
import GitHub from '@auth/core/providers/github'
import type { Handle, RequestEvent } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { parse, serialize } from 'cookie'

import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private'

const github = GitHub({
  clientId: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
})

const githubProvider = new OAuthProvider(github)

const session = new JwtSessionController()

const auth = new Auth({
  session,
  providers: [githubProvider],
})

const authHandle: Handle = async ({ event, resolve }) => {
  const internalResponse = await auth.handle(toRequest(event))

  if (internalResponse?.redirect || internalResponse?.error || internalResponse?.body) {
    return createResponse(internalResponse)
  }

  internalResponse?.cookies?.forEach((cookie) => {
    event.cookies.set(cookie.name, cookie.value, cookie.options)
  })

  return resolve(event)
}

function toRequest(event: RequestEvent): Aponia.Request {
  return {
    ...event,
    method: event.request.method,
    headers: event.request.headers,
    action: 'unknown',
    cookies: parse(event.request.headers.get('cookie') ?? ''),
  }
}

function createResponse(internalResponse: Aponia.Response): Response {
  const body = getBody(internalResponse)
  const headers = new Headers()

  console.log({ internalResponse }, internalResponse.cookies)

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

function getBody(response: Aponia.Response): BodyInit | null | undefined {
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

export const handle = sequence(authHandle)
