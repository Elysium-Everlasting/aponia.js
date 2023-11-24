import * as oauth from 'oauth4webapi'

import type { ResolvedOAuthConfig } from '../providers/oauth.js'
import type { OIDCConfig } from '../providers/oidc.js'

import type { Cookie } from './cookie.js'
import { encode, decode, type JWTOptions } from './jwt.js'

type CheckPayload = { value: string }

type AnyOAuthConfig = ResolvedOAuthConfig<any> | OIDCConfig<any>

const FifteenMinutesInSeconds = 60 * 15

const PKCE_MAX_AGE = FifteenMinutesInSeconds

const STATE_MAX_AGE = FifteenMinutesInSeconds

const NONCE_MAX_AGE = FifteenMinutesInSeconds

export const pkce = {
  create: async (config: AnyOAuthConfig) => {
    const code_verifier = oauth.generateRandomCodeVerifier()

    const value = await oauth.calculatePKCECodeChallenge(code_verifier)

    const cookie = await signCookie('pkceCodeVerifier', config, code_verifier, {
      ...config.jwt,
      maxAge: PKCE_MAX_AGE,
    })

    return [value, cookie] as const
  },

  async use(request: Aponia.InternalRequest, config: AnyOAuthConfig) {
    if (!config.checks?.includes('pkce')) {
      return ['auth', null] as const
    }

    const codeVerifier = request.cookies[config.cookies.pkceCodeVerifier.name]

    if (!codeVerifier) {
      throw new Error('PKCE code_verifier cookie was missing.')
    }

    const d = config.jwt.decode ?? decode

    const value = await d<CheckPayload>({
      ...config.jwt,
      token: codeVerifier,
    })

    if (!value?.value) {
      throw new Error('PKCE code_verifier value could not be parsed.')
    }

    const cookie: Cookie = {
      name: config.cookies.pkceCodeVerifier.name,
      value: '',
      options: { ...config.cookies.pkceCodeVerifier.options, maxAge: 0 },
    }

    return [value.value, cookie] as const
  },
}

export const state = {
  create: async (config: AnyOAuthConfig) => {
    const value = oauth.generateRandomState()

    const cookie = await signCookie('state', config, value, {
      ...config.jwt,
      maxAge: STATE_MAX_AGE,
    })

    return [value, cookie] as const
  },

  async use(request: Aponia.InternalRequest, config: AnyOAuthConfig) {
    if (!config.checks?.includes('state')) {
      return [oauth.skipStateCheck, null] as const
    }

    const state = request.cookies[config.cookies.state.name]

    if (!state) {
      throw new Error('State cookie was missing.')
    }

    const d = config.jwt.decode ?? decode

    const value = await d<CheckPayload>({ ...config.jwt, token: state })

    if (!value?.value) {
      throw new Error('State value could not be parsed.')
    }

    const cookie: Cookie = {
      name: config.cookies.state.name,
      value: '',
      options: { ...config.cookies.state.options, maxAge: 0 },
    }

    return [value.value, cookie] as const
  },
}

export const nonce = {
  create: async (config: AnyOAuthConfig) => {
    const value = oauth.generateRandomNonce()
    const cookie = await signCookie('nonce', config, value, {
      ...config.jwt,
      maxAge: NONCE_MAX_AGE,
    })
    return [value, cookie] as const
  },

  async use(request: Aponia.InternalRequest, config: AnyOAuthConfig) {
    if (!config.checks?.includes('nonce')) return [oauth.expectNoNonce, null] as const

    const nonce = request.cookies[config.cookies.nonce.name]

    if (!nonce) {
      throw new Error('Nonce cookie was missing.')
    }

    const d = config.jwt.decode ?? decode

    const value = await d<CheckPayload>({ ...config.jwt, token: nonce })

    if (!value?.value) {
      throw new Error('Nonce value could not be parsed.')
    }

    const cookie: Cookie = {
      name: config.cookies.nonce.name,
      value: '',
      options: { ...config.cookies.nonce.options, maxAge: 0 },
    }

    return [value.value, cookie] as const
  },
}

async function signCookie(
  key: Exclude<keyof AnyOAuthConfig['cookies'], 'multiplier'>,
  config: AnyOAuthConfig,
  value: string,
  jwt: JWTOptions,
) {
  const e = config.jwt.encode ?? encode

  const signedCookie: Cookie = {
    name: config.cookies[key].name,
    value: await e({ ...jwt, token: { value } }),
    options: {
      ...config.cookies[key].options,
      maxAge: jwt.maxAge ?? 60,
    },
  }

  return signedCookie
}
