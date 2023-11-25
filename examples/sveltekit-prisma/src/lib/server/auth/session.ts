import { Session } from '@aponia.js/core/session'

export const session = new Session({
  secret: 'secret',
  pages: {
    logoutRedirect: '/',
  },
})
