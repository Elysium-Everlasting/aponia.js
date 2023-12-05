import { describe, test, expect } from 'vitest'

import { parseCookie } from '../src/cookie'

describe('cookie', () => {
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
