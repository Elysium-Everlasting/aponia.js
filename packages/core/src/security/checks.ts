import * as oauth from 'oauth4webapi'

import { NONCE_MAX_AGE, PKCE_MAX_AGE, STATE_MAX_AGE } from '../constants'
import type { Check, InternalRequest } from '../types'
import { asPromise } from '../utils/as-promise'

import type { Cookie, CookiesOptions } from './cookie.js'
import { encode, decode, type JWTOptions } from './jwt.js'

interface CheckPayload {
  value: string
}

export type CheckParams = {
  checks?: Check
  jwt: JWTOptions
  cookies: CookiesOptions
}

export const pkce = {
  create: async (params: CheckParams) => {
    const codeVerifier = oauth.generateRandomCodeVerifier()

    const value = await oauth.calculatePKCECodeChallenge(codeVerifier)

    const modifiedParams = {
      ...params,
      jwt: {
        maxAge: PKCE_MAX_AGE,
        ...params.jwt,
      },
    }

    const cookie = await signCookie('pkceCodeVerifier', modifiedParams, codeVerifier)

    return [value, cookie, codeVerifier] as const
  },

  use: async (request: InternalRequest, params: CheckParams) => {
    if (!params.checks?.includes('pkce')) {
      return ['auth', null] as const
    }

    const codeVerifier = request.cookies[params.cookies.pkceCodeVerifier.name]

    if (codeVerifier == null) {
      throw new Error('PKCE code_verifier cookie was missing.')
    }

    const decodeFn = params.jwt.decode ?? decode

    const value = await asPromise(
      decodeFn({ ...params.jwt, token: codeVerifier }) as CheckPayload,
    ).catch(() => {
      return {
        value: undefined,
      }
    })

    if (value?.value == null) {
      throw new Error('PKCE code_verifier value could not be parsed.')
    }

    const cookie: Cookie = {
      name: params.cookies.pkceCodeVerifier.name,
      value: '',
      options: { ...params.cookies.pkceCodeVerifier.options, maxAge: 0 },
    }

    return [value.value, cookie] as const
  },
}

export const state = {
  create: async (params: CheckParams) => {
    const value = oauth.generateRandomState()

    const modifiedParams = {
      ...params,
      jwt: {
        maxAge: STATE_MAX_AGE,
        ...params.jwt,
      },
    }

    const cookie = await signCookie('state', modifiedParams, value)

    return [value, cookie] as const
  },

  use: async (request: InternalRequest, params: CheckParams) => {
    if (!params.checks?.includes('state')) {
      return [oauth.skipStateCheck, null] as const
    }

    const state = request.cookies[params.cookies.state.name]

    if (state == null) {
      throw new Error('State cookie was missing.')
    }

    const decodeFn = params.jwt.decode ?? decode

    const value = await asPromise(decodeFn({ ...params.jwt, token: state }) as CheckPayload).catch(
      () => {
        return {
          value: undefined,
        }
      },
    )

    if (!value?.value) {
      throw new Error('State value could not be parsed.')
    }

    const cookie: Cookie = {
      name: params.cookies.state.name,
      value: '',
      options: { ...params.cookies.state.options, maxAge: 0 },
    }

    return [value.value, cookie] as const
  },
}

export const nonce = {
  create: async (params: CheckParams) => {
    const value = oauth.generateRandomNonce()

    const modifiedParams = {
      ...params,
      jwt: {
        maxAge: NONCE_MAX_AGE,
        ...params.jwt,
      },
    }

    const cookie = await signCookie('nonce', modifiedParams, value)

    return [value, cookie] as const
  },

  use: async (request: InternalRequest, params: CheckParams) => {
    if (!params.checks?.includes('nonce' as any)) {
      return [oauth.expectNoNonce, null] as const
    }

    const nonce = request.cookies[params.cookies.nonce.name]

    if (nonce == null) {
      throw new Error('Nonce cookie was missing.')
    }

    const decodeFn = params.jwt.decode ?? decode

    const value = await asPromise(decodeFn({ ...params.jwt, token: nonce }) as CheckPayload).catch(
      () => {
        return {
          value: undefined,
        }
      },
    )

    if (value?.value == null) {
      throw new Error('Nonce value could not be parsed.')
    }

    const cookie: Cookie = {
      name: params.cookies.nonce.name,
      value: '',
      options: { ...params.cookies.nonce.options, maxAge: 0 },
    }

    return [value.value, cookie] as const
  },
}

async function signCookie(
  key: keyof CookiesOptions,
  params: CheckParams,
  value: string,
): Promise<Cookie> {
  const encodeFn = params.jwt.encode ?? encode

  const signedCookie: Cookie = {
    name: params.cookies[key].name,
    value: await encodeFn({ ...params.jwt, token: { value } }),
    options: {
      ...params.cookies[key].options,
      ...(params.jwt.maxAge != null && { maxAge: params.jwt.maxAge }),
    },
  }

  return signedCookie
}
