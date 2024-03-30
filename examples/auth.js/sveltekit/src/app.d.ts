import '@aponia.js/core/types'

import type { GitHubProfile } from '@auth/core/providers/github'
import type { GoogleProfile } from '@auth/core/providers/google'

import type { Account as DbAccount } from './db/schema/account'
import type { Session as DbSession } from './db/schema/session'
import type { User as DbUser } from './db/schema/user'

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
}
