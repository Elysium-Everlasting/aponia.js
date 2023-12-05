import { describe, test, expect } from 'vitest'

import { serializeCookie, parseCookie } from '../src/cookie'

describe('cookie', () => {
  describe('serializeCookie', () => {
    test('should serialize name and value', () => {
      expect(serializeCookie('foo', 'bar')).toEqual('foo=bar')
    })

    test('should URL-encode value', () => {
      expect(serializeCookie('foo', 'bar +baz')).toEqual('foo=bar%20%2Bbaz')
    })

    test('should serialize empty value', () => {
      expect(serializeCookie('foo', '')).toEqual('foo=')
    })

    test('should throw for invalid name', () => {
      expect(() => serializeCookie('foo\n', 'bar')).toThrow(/argument name is invalid/)
      expect(() => serializeCookie('foo\u280a', 'bar')).toThrow(/argument name is invalid/)
    })

    describe('with "domain" option', () => {
      test('should serialize domain', () => {
        expect(serializeCookie('foo', 'bar', { domain: 'example.com' })).toEqual(
          'foo=bar; Domain=example.com',
        )
      })

      test('should throw for invalid value', () => {
        expect(() => serializeCookie('foo', 'bar', { domain: 'example.com\n' })).toThrow(
          /option domain is invalid/,
        )
      })
    })

    describe('with "encode" option', () => {
      test('should specify alternative value encoder', () => {
        expect(
          serializeCookie('foo', 'bar', {
            encode: (v) => Buffer.from(v, 'utf8').toString('base64'),
          }),
        ).toEqual('foo=YmFy')
      })

      test('should throw when returned value is invalid', () => {
        expect(() =>
          serializeCookie('foo', 'bar', {
            encode: (v) => Buffer.from(v, 'utf8').toString('base64') + '\n',
          }),
        ).toThrow(/argument value is invalid/)
      })
    })

    describe('with "expires" option', () => {
      test('should set expires to given date', () => {
        expect(
          serializeCookie('foo', 'bar', {
            expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
          }),
        ).toEqual('foo=bar; Expires=Sun, 24 Dec 2000 10:30:59 GMT')
      })
    })

    describe('with "httpOnly" option', () => {
      test('should include httpOnly flag when true', () => {
        expect(serializeCookie('foo', 'bar', { httpOnly: true })).toEqual('foo=bar; HttpOnly')
      })

      test('should not include httpOnly flag when false', () => {
        expect(serializeCookie('foo', 'bar', { httpOnly: false })).toEqual('foo=bar')
      })
    })

    describe('with "maxAge" option', () => {
      test('should throw when Infinity', () => {
        expect(() => serializeCookie('foo', 'bar', { maxAge: Infinity })).toThrow(
          /option maxAge is invalid/,
        )
      })

      test('should set max-age to value', () => {
        expect(serializeCookie('foo', 'bar', { maxAge: 1000 })).toEqual('foo=bar; Max-Age=1000')
        expect(serializeCookie('foo', 'bar', { maxAge: 0 })).toEqual('foo=bar; Max-Age=0')
      })

      test('should set max-age to integer value', () => {
        expect(serializeCookie('foo', 'bar', { maxAge: 3.14 })).toEqual('foo=bar; Max-Age=3')
        expect(serializeCookie('foo', 'bar', { maxAge: 3.99 })).toEqual('foo=bar; Max-Age=3')
      })
    })

    describe('with "partitioned" option', function () {
      test('should include partitioned flag when true', () => {
        expect(serializeCookie('foo', 'bar', { partitioned: true })).toEqual('foo=bar; Partitioned')
      })

      test('should not include partitioned flag when false', () => {
        expect(serializeCookie('foo', 'bar', { partitioned: false })).toEqual('foo=bar')
      })

      test('should not include partitioned flag when not defined', () => {
        expect(serializeCookie('foo', 'bar', {})).toEqual('foo=bar')
      })
    })

    describe('with "path" option', () => {
      test('should serialize path', () => {
        expect(serializeCookie('foo', 'bar', { path: '/' })).toEqual('foo=bar; Path=/')
      })

      test('should throw for invalid value', () => {
        expect(() => serializeCookie('foo', 'bar', { path: '/\n' })).toThrow(
          /option path is invalid/,
        )
      })
    })

    describe('with "priority" option', () => {
      test('should set priority low', () => {
        expect(serializeCookie('foo', 'bar', { priority: 'low' })).toEqual('foo=bar; Priority=Low')
      })

      test('should set priority medium', () => {
        expect(serializeCookie('foo', 'bar', { priority: 'medium' })).toEqual(
          'foo=bar; Priority=Medium',
        )
      })

      test('should set priority high', () => {
        expect(serializeCookie('foo', 'bar', { priority: 'high' })).toEqual(
          'foo=bar; Priority=High',
        )
      })
    })

    describe('with "sameSite" option', function () {
      test('should set sameSite strict', () => {
        expect(serializeCookie('foo', 'bar', { sameSite: 'strict' })).toEqual(
          'foo=bar; SameSite=Strict',
        )
      })

      test('should set sameSite lax', () => {
        expect(serializeCookie('foo', 'bar', { sameSite: 'lax' })).toEqual('foo=bar; SameSite=Lax')
      })

      test('should set sameSite none', () => {
        expect(serializeCookie('foo', 'bar', { sameSite: 'none' })).toEqual(
          'foo=bar; SameSite=None',
        )
      })

      test('should set sameSite strict when true', () => {
        expect(serializeCookie('foo', 'bar', { sameSite: true })).toEqual(
          'foo=bar; SameSite=Strict',
        )
      })

      test('should not set sameSite when false', () => {
        expect(serializeCookie('foo', 'bar', { sameSite: false })).toEqual('foo=bar')
      })
    })

    describe('with "secure" option', () => {
      test('should include secure flag when true', () => {
        expect(serializeCookie('foo', 'bar', { secure: true })).toEqual('foo=bar; Secure')
      })

      test('should not include secure flag when false', () => {
        expect(serializeCookie('foo', 'bar', { secure: false })).toEqual('foo=bar')
      })
    })
  })

  describe('parseCookie', () => {
    test('parses cookie string to object', () => {
      expect(parseCookie('foo=bar')).toEqual({ foo: 'bar' })
      expect(parseCookie('foo=123')).toEqual({ foo: '123' })
    })

    test('ignores whitespace', () => {
      expect(parseCookie('FOO    = bar;   baz  =   raz')).toEqual({ FOO: 'bar', baz: 'raz' })
    })

    test('parses cookie with empty value', () => {
      expect(parseCookie('foo= ; bar=')).toEqual({ foo: '', bar: '' })
    })

    test('URL-decodes values', () => {
      expect(parseCookie('foo="bar=123456789&name=Magic+Mouse"')).toEqual({
        foo: 'bar=123456789&name=Magic+Mouse',
      })

      expect(parseCookie('email=%20%22%2c%3b%2f')).toEqual({ email: ' ",;/' })
    })

    test('returns original value on decode error', () => {
      expect(parseCookie('foo=%1')).toEqual({ foo: '%1' })
    })

    test('ignores cookies without value', () => {
      expect(parseCookie('foo=bar;fizz  ;  buzz')).toEqual({ foo: 'bar' })
      expect(parseCookie('  fizz; foo=  bar')).toEqual({ foo: 'bar' })
    })

    test('ignores duplicate cookies', () => {
      expect(parseCookie('foo=bar;foo=boo')).toEqual({ foo: 'bar' })
      expect(parseCookie('foo=bar;foo=boo;foo=bar')).toEqual({ foo: 'bar' })
      expect(parseCookie('foo=bar;foo=boo;foo=bar;foo=boo')).toEqual({ foo: 'bar' })
    })

    test('correctly parses with custom decoder', () => {
      expect(
        parseCookie('foo="YmFy"', { decode: (v) => Buffer.from(v, 'base64').toString() }),
      ).toEqual({ foo: 'bar' })
    })
  })
})
