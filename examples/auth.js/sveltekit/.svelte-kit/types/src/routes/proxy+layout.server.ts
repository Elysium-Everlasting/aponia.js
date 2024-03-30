// @ts-nocheck
import type { LayoutServerLoad } from './$types'

import { jwtSession } from '$lib/server/auth'

export const load = async (event: Parameters<LayoutServerLoad>[0]) => {
  const session = await jwtSession.parseSessionFromCookies(event.cookies)
  return { session }
}
