import createAuthHelpers from '@aponia.js/sveltekit/.'
import { sequence } from '@sveltejs/kit/hooks'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

prisma

import { auth } from '$lib/auth'

const authHandle = createAuthHelpers(auth)

export const handle = sequence(authHandle)
