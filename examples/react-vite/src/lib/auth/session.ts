import { SessionManager } from '@aponia.js/core/session'

export const session = new SessionManager({
  createCookieOptions: {
    globalOverrides: {
      httpOnly: false,
    },
  },
})
