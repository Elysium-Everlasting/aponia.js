import { describe, test, expect } from 'vitest'

import { Router } from '../src/router'

describe('Router', () => {
  test('should be able to add routes', () => {
    const router = new Router()

    const route = '/foo'
    const handler = () => {}

    router.get(route, handler)

    expect(router.routers.GET.lookup(route)?.['handler']).toBe(handler)
  })

  test('can add multiple pre routes', () => {
    const router = new Router()

    const route = '/foo'
    const handler = () => {}
    const numberHandlers = 5

    Array.from(Array(numberHandlers).keys()).forEach(() => router.preHandle(route, handler))

    expect(router.routers.pre?.lookup(route)?.['handlers']).toHaveLength(numberHandlers)
  })
})
