import { SessionManager } from '@aponia.js/core/session'

export const session = new SessionManager({
  secret: 'secret',

  async createSession(user) {
    return {
      user,
      accessToken: user,
    }
  },

  onInvalidateAccessToken() {
    return { redirect: '/', status: 302 }
  },
})
