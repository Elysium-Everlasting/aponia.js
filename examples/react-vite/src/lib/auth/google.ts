import { Google } from '@aponia.js/core/providers/google'

export const google = Google({
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  onAuth: async (user, _tokens) => {
    console.log({ user })
    return { user }
  },
})
