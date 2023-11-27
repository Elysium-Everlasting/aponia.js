import '@sveltejs/kit'
import type { Session } from '@auth/core/types'

declare global {
  // namespace Aponia {
  //   interface User extends Auth.User {}
  //   interface AccessToken extends Auth.AccessToken {}
  //   interface RefreshToken extends Auth.RefreshToken {}
  // }

  namespace App {
    interface Locals {
      /**
       * Helper function to get the user for the current request.
       */
      getSession: () => Promise<Session | null>
    }

    interface PageData {
      session?: Session
    }
  }
}

export {}
