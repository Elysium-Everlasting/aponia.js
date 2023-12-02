import crypto from 'node:crypto'

import { beforeAll, describe, test, expect } from 'vitest'

import { pkce } from '../../src/security/checks'
import { DEFAULT_COOKIES_OPTIONS } from '../../src/security/cookie'
import { DEFAULT_JWT_OPTIONS } from '../../src/security/jwt'

beforeAll(() => {
  const originalCrypto = globalThis.crypto

  globalThis.crypto = crypto as typeof originalCrypto

  return () => {
    globalThis.crypto = originalCrypto
  }
})

describe('checks', () => {
  describe('pkce', () => {
    test('', async () => {
      const [value, cookie] = await pkce.create({
        jwt: DEFAULT_JWT_OPTIONS,
        cookies: DEFAULT_COOKIES_OPTIONS,
      })

      expect(cookie.options).toEqual(DEFAULT_COOKIES_OPTIONS.pkceCodeVerifier.options)
      expect(value.length).toEqual(43)
    })
  })
})
