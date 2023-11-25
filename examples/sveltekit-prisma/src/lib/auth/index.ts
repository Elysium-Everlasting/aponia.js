import { Auth } from '@aponia.js/core'
import { adapt } from '@aponia.js/adapter-prisma'

import { prisma } from '$lib/server/db'
import { google } from './google'
import { session } from './session'

const baseAuth = new Auth({
  session,
  providers: [google],
})

export const auth = adapt(baseAuth, prisma)
