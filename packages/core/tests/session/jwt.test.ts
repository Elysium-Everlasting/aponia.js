import type { Session } from '@auth/core/types'
import { describe, test, expect, vi } from 'vitest'

import { DEFAULT_COOKIES_OPTIONS } from '../../src/security/cookie'
import type { SessionTokens } from '../../src/session'
import { JwtSessionController, createSessionController } from '../../src/session/jwt'
import type { InternalRequest } from '../../src/types'

describe('SessionController', () => {
  describe('constructor', () => {
    test('does not throw error if no secret is given because default secret is used', () => {
      expect(() => new JwtSessionController()).not.toThrow()
    })

    test('throws error if secret is given with less than 1 character', () => {
      expect(() => new JwtSessionController({ secret: '' })).toThrow()
    })

    test('overrides default jwt settings with custom jwt settings', () => {
      const encode = vi.fn()

      const sessionController = new JwtSessionController({
        jwt: {
          encode,
        },
      })

      expect(sessionController.config.jwt.encode).toBe(encode)
    })
  })

  describe('getRawTokensFromRequest', () => {
    test('returns the access token and refresh token from the request cookies', () => {
      const sessionController = new JwtSessionController()

      const accessToken = 'access_token'
      const refreshToken = 'refresh_token'

      const url = new URL('http://localhost')

      const request: InternalRequest = {
        request: new Request(url),
        url,
        cookies: {
          [DEFAULT_COOKIES_OPTIONS.accessToken.name]: accessToken,
          [DEFAULT_COOKIES_OPTIONS.refreshToken.name]: refreshToken,
        },
      }

      expect(sessionController.getRawTokensFromCookies(request.cookies)).toEqual({
        accessToken,
        refreshToken,
      })
    })
  })

  describe('decodeRawTokens', () => {
    test('returns undefined when token does not exist', async () => {
      const sessionController = new JwtSessionController()

      const decodedTokens = await sessionController.decodeRawTokens({})

      expect(decodedTokens).toEqual({ accessToken: undefined, refreshToken: undefined })
    })

    test('decodes tokens when they exist', async () => {
      const value = 'decoded_token'

      const sessionController = new JwtSessionController({
        jwt: {
          decode: () => value,
        },
      })

      const decodedTokens = await sessionController.decodeRawTokens({
        accessToken: '',
        refreshToken: '',
      })

      expect(decodedTokens.accessToken).toEqual(value)
      expect(decodedTokens.refreshToken).toEqual(value)
    })

    test('returns undefined when token cannot be decoded', async () => {
      const sessionController = new JwtSessionController({
        jwt: {
          decode: async () => {
            throw new Error()
          },
        },
      })

      const decodedTokens = await sessionController.decodeRawTokens({
        accessToken: '',
        refreshToken: '',
      })

      expect(decodedTokens).toEqual({ accessToken: undefined, refreshToken: undefined })
    })
  })

  describe('getTokensFromRequest', () => {
    test('returns undefined when token does not exist', async () => {
      const sessionController = new JwtSessionController()

      const decodedTokens = await sessionController.getTokensFromCookies({})

      expect(decodedTokens).toEqual({ accessToken: undefined, refreshToken: undefined })
    })

    test('decodes tokens when they exist', async () => {
      const value = 'decoded_token'

      const sessionController = new JwtSessionController({
        jwt: {
          decode: () => value,
        },
      })

      const decodedTokens = await sessionController.getTokensFromCookies({
        [DEFAULT_COOKIES_OPTIONS.accessToken.name]: '',
        [DEFAULT_COOKIES_OPTIONS.refreshToken.name]: '',
      })

      expect(decodedTokens.accessToken).toEqual(value)
      expect(decodedTokens.refreshToken).toEqual(value)
    })

    test('returns undefined when token cannot be decoded', async () => {
      const sessionController = new JwtSessionController({
        jwt: {
          decode: async () => {
            throw new Error()
          },
        },
      })

      const decodedTokens = await sessionController.getTokensFromCookies({
        [DEFAULT_COOKIES_OPTIONS.accessToken.name]: '',
        [DEFAULT_COOKIES_OPTIONS.refreshToken.name]: '',
      })

      expect(decodedTokens).toEqual({ accessToken: undefined, refreshToken: undefined })
    })
  })

  describe('createCookiesFromTokens', () => {
    test('returns no cookies if no tokens are given', async () => {
      const sessionController = new JwtSessionController()

      const cookies = await sessionController.createCookiesFromSession({})

      expect(cookies).toHaveLength(0)
    })

    test('returns one cookie if either token is given', async () => {
      const sessionController = new JwtSessionController()

      const cookies = await sessionController.createCookiesFromSession({
        accessToken: {
          expires: '',
        },
      })

      expect(cookies).toHaveLength(1)
    })

    test('returns two cookies if both tokens are given', async () => {
      const sessionController = new JwtSessionController()

      const cookies = await sessionController.createCookiesFromSession({
        accessToken: {
          expires: '',
        },
        refreshToken: {
          expires: '',
        },
      })

      expect(cookies).toHaveLength(2)
    })
  })

  describe('getSessionFromRequest', () => {
    test('returns undefined session if no valid access token', async () => {
      const defaultSession = { session: 'session' }

      const sessionController = new JwtSessionController({
        jwt: {
          decode: () => defaultSession,
        },
      })

      const url = new URL('http://localhost')

      const request: InternalRequest = {
        url,
        request: new Request(url),
        cookies: {},
      }

      const session = await sessionController.getSessionFromCookies(request.cookies)

      expect(session).toBeUndefined()
    })

    test('returns session from access token if valid access token', async () => {
      const defaultSession = { session: 'session' }

      const sessionController = new JwtSessionController({
        jwt: {
          decode: () => defaultSession,
        },
      })

      const url = new URL('http://localhost')

      const request: InternalRequest = {
        url,
        request: new Request(url),
        cookies: {
          [DEFAULT_COOKIES_OPTIONS.accessToken.name]: '',
        },
      }

      const session = await sessionController.getSessionFromCookies(request.cookies)

      expect(session).toEqual(defaultSession)
    })

    test('calls getSessionFromTokens callback if provided and defined tokens were decoded', async () => {
      const getSessionFromTokens = vi.fn()

      const sessionController = new JwtSessionController({
        getSessionFromSessionTokens: getSessionFromTokens,
        jwt: {
          decode: () => ({}),
        },
      })

      const url = new URL('http://localhost')

      const request: InternalRequest = {
        url,
        request: new Request(url),
        cookies: {
          [DEFAULT_COOKIES_OPTIONS.accessToken.name]: '',
        },
      }

      await sessionController.getSessionFromCookies(request.cookies)

      expect(getSessionFromTokens).toHaveBeenCalled()
    })
  })

  describe('handleRequest', () => {
    test('returns undefined if access token exists', async () => {
      const sessionController = new JwtSessionController()

      const url = new URL('http://localhost')

      const request: InternalRequest = {
        url,
        request: new Request(url),
        cookies: {
          [DEFAULT_COOKIES_OPTIONS.accessToken.name]: '',
        },
      }

      const response = await sessionController.handleRequest(request)

      expect(response).toBeUndefined()
    })

    test('returns undefined if neither access and refresh tokens exist', async () => {
      const sessionController = new JwtSessionController()

      const url = new URL('http://localhost')

      const request: InternalRequest = {
        url,
        request: new Request(url),
        cookies: {},
      }

      const response = await sessionController.handleRequest(request)

      expect(response).toBeUndefined()
    })

    describe('correctly refreshes session', () => {
      test('returns new session', async () => {
        const newSession = { session: 'session' }

        const sessionController = new JwtSessionController({
          jwt: {
            decode: () => newSession,
          },
        })

        const url = new URL('http://localhost')

        const request: InternalRequest = {
          url,
          request: new Request(url),
          cookies: {
            [DEFAULT_COOKIES_OPTIONS.refreshToken.name]: '',
          },
        }

        const response = await sessionController.handleRequest(request)

        expect(response?.session).toEqual(newSession)
      })

      test('calls refreshTokens callback to get new tokens if provided', async () => {
        const accessToken: Session = {
          expires: '',
          user: {
            id: 'ABC',
          },
        }

        const refreshTokens = vi.fn(() => {
          const tokens: SessionTokens = { accessToken }
          return tokens
        })

        const sessionController = new JwtSessionController({
          refreshTokens,
          jwt: {
            decode: () => ({}),
          },
        })

        const url = new URL('http://localhost')

        const request: InternalRequest = {
          url,
          request: new Request(url),
          cookies: {
            [DEFAULT_COOKIES_OPTIONS.refreshToken.name]: '',
          },
        }

        const response = await sessionController.handleRequest(request)

        expect(refreshTokens).toHaveBeenCalled()
        expect(response?.session).toEqual(accessToken)
      })

      test('calls getSessionFromTokens if provided to transform the session', async () => {
        const customSession: Session = {
          expires: '',
          user: {
            id: 'CUSTOM',
          },
        }

        const getSessionFromTokens = vi.fn(() => customSession)

        const sessionController = new JwtSessionController({
          getSessionFromSessionTokens: getSessionFromTokens,
          jwt: {
            decode: () => ({}),
          },
        })

        const url = new URL('http://localhost')

        const request: InternalRequest = {
          url,
          request: new Request(url),
          cookies: {
            [DEFAULT_COOKIES_OPTIONS.refreshToken.name]: '',
          },
        }

        const response = await sessionController.handleRequest(request)

        expect(getSessionFromTokens).toHaveBeenCalled()
        expect(response?.session).toEqual(customSession)
      })
    })
  })

  describe('invalidateSession', () => {
    test('calls provided onInvalidateSession callback', async () => {
      const onInvalidate = vi.fn()

      const sessionController = new JwtSessionController({ onInvalidate })

      const url = new URL('http://localhost')

      await sessionController.invalidateSession({
        url,
        request: new Request(url),
        cookies: {},
      })

      expect(onInvalidate).toHaveBeenCalled()
    })
  })

  describe('createSessionController', () => {
    test('returns a new session controller with the provided config', () => {
      const sessionController = createSessionController()

      expect(sessionController).toBeInstanceOf(JwtSessionController)
    })
  })
})
