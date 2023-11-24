import '@aponia/sveltekit'
import '@sveltejs/kit'

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
      getUser: () => Promise<Aponia.User | null>
    }

    interface PageData {
      /**
       * User parsed from session / cookies. `isAdmin` is added to the user.
       */
      user?: Aponia.User & { isAdmin: boolean }
    }
  }
}

export {}
