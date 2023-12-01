import * as oauth from 'oauth4webapi'

import { NONCE_MAX_AGE, PKCE_MAX_AGE, STATE_MAX_AGE } from '../constants'
import type { Check, InternalRequest } from '../types'

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
    const code_verifier = oauth.generateRandomCodeVerifier()

    const value = await oauth.calculatePKCECodeChallenge(code_verifier)

    const modifiedParams = {
      ...params,
      jwt: {
        ...params.jwt,
        maxAge: PKCE_MAX_AGE,
      },
    }

    const cookie = await signCookie('pkceCodeVerifier', modifiedParams, code_verifier)

    return [value, cookie] as const
  },

  async use(request: InternalRequest, params: CheckParams) {
    if (!params.checks?.includes('pkce')) {
      return ['auth', null] as const
    }

    const codeVerifier = request.cookies[params.cookies.pkceCodeVerifier.name]

    if (!codeVerifier) {
      throw new Error('PKCE code_verifier cookie was missing.')
    }

    const decodeFn = params.jwt.decode ?? decode

    const value = await decodeFn<CheckPayload>({
      ...params.jwt,
      token: codeVerifier,
    })

    if (!value?.value) {
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
        ...params.jwt,
        maxAge: STATE_MAX_AGE,
      },
    }

    const cookie = await signCookie('state', modifiedParams, value)

    return [value, cookie] as const
  },

  async use(request: InternalRequest, params: CheckParams) {
    if (!params.checks?.includes('state')) {
      return [oauth.skipStateCheck, null] as const
    }

    console.log(request, params)

    const state = request.cookies[params.cookies.state.name]

    if (!state) {
      throw new Error('State cookie was missing.')
    }

    const d = params.jwt.decode ?? decode

    const value = await d<CheckPayload>({ ...params.jwt, token: state })

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
        ...params.jwt,
        maxAge: NONCE_MAX_AGE,
      },
    }

    const cookie = await signCookie('nonce', modifiedParams, value)

    return [value, cookie] as const
  },

  async use(request: InternalRequest, params: CheckParams) {
    if (!params.checks?.includes('nonce' as any)) {
      return [oauth.expectNoNonce, null] as const
    }

    const nonce = request.cookies[params.cookies.nonce.name]

    if (!nonce) {
      throw new Error('Nonce cookie was missing.')
    }

    const decodeFn = params.jwt.decode ?? decode

    const value = await decodeFn<CheckPayload>({ ...params.jwt, token: nonce })

    if (!value?.value) {
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

async function signCookie(key: keyof CookiesOptions, params: CheckParams, value: string) {
  const encodeFn = params.jwt.encode ?? encode

  const signedCookie: Cookie = {
    name: params.cookies[key].name,
    value: await encodeFn({ ...params.jwt, token: { value } }),
    options: {
      ...params.cookies[key].options,
      maxAge: params.jwt.maxAge ?? 60,
    },
  }

  return signedCookie
}
