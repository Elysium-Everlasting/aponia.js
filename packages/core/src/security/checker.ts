import * as oauth from 'oauth4webapi'

import type { Awaitable } from '../utils/types'

export interface CheckerConfig {
  checks?: Check[]
  encode?: (value: string) => string
  decode?: (value: string) => string
}

export type Check = 'pkce' | 'state' | 'nonce'

export class Checker {
  config: CheckerConfig

  checks: Check[]

  encode: (value: string) => Awaitable<string>

  decode: (value: string) => Awaitable<string>

  constructor(config: CheckerConfig = {}) {
    this.config = config

    this.checks = config.checks ?? ['pkce']

    this.encode = config.encode ?? ((value) => value)

    this.decode = config.decode ?? ((value) => value)
  }

  async createPkce() {
    const verifier = oauth.generateRandomCodeVerifier()

    const challenge = await oauth.calculatePKCECodeChallenge(verifier)

    const encodedChallenge = await this.encode(challenge)

    return [verifier, encodedChallenge] as const
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

  async useNonce(nonce: string) {
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

export const DEFAULT_CHECKER = new Checker()
