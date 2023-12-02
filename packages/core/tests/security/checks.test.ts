import crypto from 'node:crypto'

import { beforeAll, describe, test, expect } from 'vitest'

import { pkce } from '../../src/security/checks'
import { DEFAULT_COOKIES_OPTIONS } from '../../src/security/cookie'
import { DEFAULT_JWT_OPTIONS } from '../../src/security/jwt'
import type { InternalRequest } from '../../src/types'

beforeAll(() => {
  const originalCrypto = globalThis.crypto

  globalThis.crypto = crypto as typeof originalCrypto

  return () => {
    globalThis.crypto = originalCrypto
  }
})

const exampleUrl = new URL('https://example.com')
const exampleRequest = new Request(exampleUrl)
const exampleInternalRequest = {
  request: exampleRequest,
  cookies: {},
  url: exampleUrl,
}

describe('checks', () => {
  describe('pkce', () => {
    describe('create', () => {
      test('correctly creates value and cookie with default settings', async () => {
        const [value, cookie] = await pkce.create({
          jwt: DEFAULT_JWT_OPTIONS,
          cookies: DEFAULT_COOKIES_OPTIONS,
        })

        expect(cookie.options).toEqual(DEFAULT_COOKIES_OPTIONS.pkceCodeVerifier.options)
        expect(value.length).toEqual(43)
      })

      test('defining jwt maxAge overrides the cookie maxAge', async () => {
        const maxAge = 100

        const [, cookie] = await pkce.create({
          jwt: {
            secret: 'secret',
            maxAge,
          },
          cookies: DEFAULT_COOKIES_OPTIONS,
        })

        expect(cookie.options?.maxAge).toEqual(maxAge)
      })
    })

    describe('use', () => {
      test('returns correct values if not using pkce check', async () => {
        const [value, cookie] = await pkce.use(exampleInternalRequest, {
          checks: [],
          cookies: DEFAULT_COOKIES_OPTIONS,
          jwt: DEFAULT_JWT_OPTIONS,
        })

        expect(value).toBeTypeOf('string')
        expect(cookie).toEqual(null)
      })

      test('throws error if PKCE code_verifier cookie is missing', async () => {
        await expect(
          pkce.use(exampleInternalRequest, {
            checks: ['pkce'],
            cookies: DEFAULT_COOKIES_OPTIONS,
            jwt: DEFAULT_JWT_OPTIONS,
          }),
        ).rejects.toThrow()
      })

      test('throws error if PKCE code_verifier value could not be parsed', async () => {
        const internalRequest: InternalRequest = {
          ...exampleInternalRequest,
          cookies: {
            [DEFAULT_COOKIES_OPTIONS.pkceCodeVerifier.name]: 'invalid',
          },
        }

        await expect(
          pkce.use(internalRequest, {
            checks: ['pkce'],
            cookies: DEFAULT_COOKIES_OPTIONS,
            jwt: DEFAULT_JWT_OPTIONS,
          }),
        ).rejects.toThrow()
      })

      test('returns original value and cookie if valid', async () => {
        const [, cookie, codeVerifier] = await pkce.create({
          jwt: {
            secret: 'secret',
          },
          cookies: DEFAULT_COOKIES_OPTIONS,
        })

        const internalRequest: InternalRequest = {
          ...exampleInternalRequest,
          cookies: {
            [cookie.name]: cookie.value,
          },
        }

        const [value] = await pkce.use(internalRequest, {
          checks: ['pkce'],
          cookies: DEFAULT_COOKIES_OPTIONS,
          jwt: DEFAULT_JWT_OPTIONS,
        })

        expect(value).toEqual(codeVerifier)
      })
    })
  })
})
