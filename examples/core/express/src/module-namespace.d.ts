import '@aponia.js/core/types'

export interface GitHubAccount {
  id: string
  name: string
  email: string
  image: string
}

declare global {
  namespace Aponia {
    interface Account {
      email: any
    }

    interface ProviderAccount extends GitHubAccount {}

    interface ProviderAccountMapping {
      github?: GitHubAccount
    }
  }
}
