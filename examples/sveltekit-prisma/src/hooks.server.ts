import createAuthHelpers from '@aponia.js/sveltekit'
import { sequence } from '@sveltejs/kit/hooks'
import { auth } from '$lib/server/auth'

const authHandle = createAuthHelpers(auth)

export const handle = sequence(authHandle)
