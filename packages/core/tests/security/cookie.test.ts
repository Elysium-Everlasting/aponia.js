import { describe, test, expect } from 'vitest'

import { DEFAULT_COOKIE_NAME, DEFAULT_SECURE_PREFIX } from '../../src/constants'
import {
  getCookiePrefix,
  createCookiesOptions,
  type CreateCookiesOptions,
} from '../../src/security/cookie'

describe('cookie', () => {
  describe('getCookiePrefix', () => {
    test('returns default cookie name for default, insecure settings', () => {
      const prefix = getCookiePrefix()

      expect(prefix).toBe(DEFAULT_COOKIE_NAME)
    })

    test('returns custom cookie name for insecure cookie with custom name', () => {
      const cookieName = 'custom-name'

      const prefix = getCookiePrefix({ cookieName })

      expect(prefix).toBe(cookieName)
    })

    test('returns custom cookie name with default prefix for secure cookie with default settings', () => {
      const cookieName = 'custom-name'

      const prefix = getCookiePrefix({ cookieName, serializationOptions: { secure: true } })

      expect(prefix).toBe(`${DEFAULT_SECURE_PREFIX}${cookieName}`)
    })

    test('returns custom cookie name with custom prefix for secure cookie with custom options', () => {
      const cookieName = 'custom-name'
      const securePrefix = 'custom-prefix'

      const prefix = getCookiePrefix({
        cookieName,
        securePrefix,
        serializationOptions: { secure: true },
      })

      expect(prefix).toBe(`${securePrefix}${cookieName}`)
    })

    test('ignores custom prefix for insecure cookie', () => {
      const cookieName = 'custom-name'
      const securePrefix = 'custom-prefix'

      const prefix = getCookiePrefix({ cookieName, securePrefix })

      expect(prefix).toBe(cookieName)
    })
  })

  describe('createCookiesOptions', () => {
    test('all cookies start with the cookie prefix', () => {
      const options: CreateCookiesOptions = {
        serializationOptions: {
          secure: true,
        },
        securePrefix: 'custom-prefix',
      }

      const prefix = getCookiePrefix(options)

      const cookies = createCookiesOptions(options)

      expect(cookies.accessToken.name.startsWith(prefix)).toBeTruthy()
      expect(cookies.refreshToken.name.startsWith(prefix)).toBeTruthy()
      expect(cookies.callbackUrl.name.startsWith(prefix)).toBeTruthy()
      // expect(cookies.csrfToken.name.startsWith(prefix)).toBeTruthy()
      expect(cookies.pkceCodeVerifier.name.startsWith(prefix)).toBeTruthy()
      expect(cookies.nonce.name.startsWith(prefix)).toBeTruthy()
      expect(cookies.state.name.startsWith(prefix)).toBeTruthy()
    })
  })
})
