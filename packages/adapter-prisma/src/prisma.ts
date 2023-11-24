import { Auth } from '@aponia.js/core'

export type PrismaClient = any

export type PrismaAdapterOptions = {
  /**
   * Mappings.
   */
  mappings?: any
}

export class PrismaAdapter {
  auth: Auth

  prisma: PrismaClient

  options: PrismaAdapterOptions

  constructor(auth: Auth, prisma: PrismaClient, options: PrismaAdapterOptions = {}) {
    this.auth = auth
    this.prisma = prisma
    this.options = options

    this.auth.providers.forEach((provider) => {
      if (provider.type === 'email' || provider.type === 'credentials') {
        return
      }

      provider.config.onAuth ??= async (user: any, tokens: any) => {
        const profile = await provider.config.profile?.(user, tokens)

        if (profile == null) {
          return
        }
      }
    })

    // this.auth.session.config.createSession ??= async (session) => {
    //   session
    // }

    // this.auth.session.config.onInvalidateAccessToken ??= async (accessToken, refreshToken) => {
    // }
  }
}
