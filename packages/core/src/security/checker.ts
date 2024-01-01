import * as oauth from 'oauth4webapi'

import type { Awaitable } from '../utils/types'

export type TokenEncoder = (value: string) => Awaitable<string>

export type TokenDecoder = (value: string) => Awaitable<string>

export interface CheckerConfig {
  checks?: Check[]
  encode?: TokenEncoder
  decode?: TokenDecoder
}

export type Check = 'pkce' | 'state' | 'nonce'

export class Checker {
  checks: Check[]

  encode: TokenEncoder

  decode: TokenDecoder

  constructor(public config: CheckerConfig = {}) {
    this.checks = config.checks ?? DEFAULT_CHECKS
    this.encode = config.encode ?? defaultEncoderDecoder
    this.decode = config.decode ?? defaultEncoderDecoder
  }

  setConfig(config: CheckerConfig = this.config) {
    this.config = config
    this.checks = config.checks ?? DEFAULT_CHECKS
    this.encode = config.encode ?? defaultEncoderDecoder
    this.decode = config.decode ?? defaultEncoderDecoder
  }

  async createPkce() {
    const verifier = oauth.generateRandomCodeVerifier()

    const encodedVerifier = await this.encode(verifier)

    const challenge = await oauth.calculatePKCECodeChallenge(verifier)

    return [challenge, encodedVerifier] as const
  }

  async usePkce(pkce?: string): Promise<void | string> {
    if (!this.checks.includes('pkce')) {
      return
    }

    if (pkce == null) {
      throw new Error('PKCE code_verifier cookie was missing.')
    }

    const decodedPkce = await this.decode(pkce)

    if (decodedPkce == null) {
      throw new Error('PKCE code_verifier value could not be parsed.')
    }

    return decodedPkce
  }

  async createState(): Promise<string> {
    const state = oauth.generateRandomState()

    const encodedState = await this.encode(state)

    return encodedState
  }

  async useState(state?: string) {
    if (!this.checks.includes('state')) {
      return oauth.skipStateCheck
    }

    if (state == null) {
      throw new Error('State cookie was missing.')
    }

    const decodedState = await this.decode(state)

    return decodedState
  }

  async createNonce(): Promise<string> {
    const nonce = oauth.generateRandomNonce()

    const encodedNonce = await this.encode(nonce)

    return encodedNonce
  }

  async useNonce(nonce?: string) {
    if (!this.checks.includes('nonce')) {
      return oauth.expectNoNonce
    }

    if (nonce == null) {
      throw new Error('Nonce cookie was missing.')
    }

    const decodedNonce = await this.decode(nonce)

    return decodedNonce
  }
}

export const DEFAULT_CHECKS: Check[] = ['pkce']

function defaultEncoderDecoder(value: string) {
  return value
}
