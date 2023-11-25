import { Auth } from '@aponia.js/core'
import { adapt } from '@aponia.js/adapter-prisma'

import { prisma } from '$lib/server/db'
import { google } from './providers/google'
import { github } from './providers/github'
import { session } from './session'

const baseAuth = new Auth({
  session,
  providers: [google, github],
})

export const auth = adapt(baseAuth, prisma)
