import type { LayoutServerLoad } from './$types'

import { jwtSession } from '$lib/server/auth'

export const load: LayoutServerLoad = async (event) => {
  const session = await jwtSession.parseSessionFromCookies(event.cookies)
  return { session }
}
