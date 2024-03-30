import '@aponia.js/core/types'

import type { GitHubProfile } from '@auth/core/providers/github'
import type { GoogleProfile } from '@auth/core/providers/google'

import type { Account as DbAccount } from '$lib/server/db/schema/account'
import type { Session as DbSession } from '$lib/server/db/schema/session'
import type { User as DbUser } from '$lib/server/db/schema/user'

declare global {
  namespace Aponia {
    interface User extends DbUser {}

    interface Account extends DbAccount {}

    interface Session extends DbSession {}

    interface ProviderAccount extends GitHubAccount {}

    interface ProviderAccountMapping {
      github?: GitHubProfile
      google?: GoogleProfile
    }
  }

  namespace App {
    interface PageData {
      session?: Aponia.Session
    }
  }
}
