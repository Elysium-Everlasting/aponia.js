import adapterPrisma from '@aponia.js/adapter-prisma'
import { SvelteKitAuth } from '@aponia.js/sveltekit'
import { sequence } from '@sveltejs/kit/hooks'
import GitHub from '@auth/core/providers/github'
import Google from '@auth/core/providers/google'

import { prisma } from '$lib/server/db'
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private'
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private'

const authHandle = SvelteKitAuth({
  adapter: adapterPrisma(prisma),
  session: {
    pages: {
      logoutRedirect: '/',
    },
  },
  providers: [
    GitHub({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
    }),
    Google({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
  ],
})

export const handle = sequence(authHandle)
