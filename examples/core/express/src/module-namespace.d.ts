import '@aponia.js/core/types'

import type { Account as DbAccount } from './db/schema/account'
import type { Session as DbSession } from './db/schema/session'
import type { User as DbUser } from './db/schema/user'

export interface GitHubAccount {
  id: string
  name: string
  email: string
  image: string
}

declare global {
  namespace Aponia {
    interface User extends DbUser {}

    interface Account extends DbAccount {}

    interface Session extends DbSession {}

    interface ProviderAccount extends GitHubAccount {}

    interface ProviderAccountMapping {
      github?: GitHubAccount
    }
  }
}
