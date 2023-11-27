import { prisma } from '$lib/server/db'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async (event) => {
  const session = await event.locals.getSession()

  const users = await prisma.user.findMany()

  return { session, users }
}

export const actions: Actions = {
  deleteUsers: async () => {
    const result = await prisma.user.deleteMany()

    return { result }
  },
}
