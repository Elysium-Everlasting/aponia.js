import { Auth } from '@aponia.js/core'
import { adapt } from '@aponia.js/adapter-prisma'
import createAuthHelpers from '@aponia.js/sveltekit'
import { sequence } from '@sveltejs/kit/hooks'
import GitHub from '@auth/core/providers/github'
import Google from '@auth/core/providers/google'

import { prisma } from '$lib/server/db'
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private'
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private'

const baseAuth = new Auth({
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

export const auth = adapt(baseAuth, prisma)

const authHandle = createAuthHelpers(auth)

export const handle = sequence(authHandle)
