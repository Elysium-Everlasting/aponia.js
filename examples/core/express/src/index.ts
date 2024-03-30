import { type Adapter, AdapterPlugin } from '@aponia.js/core/adapter'
import { Auth } from '@aponia.js/core/auth'
import { OAuthProvider } from '@aponia.js/core/plugins/providers/oauth'
import { OIDCProvider } from '@aponia.js/core/plugins/providers/oidc'
import { JwtSessionPlugin } from '@aponia.js/core/plugins/session/jwt'
import { serialize } from 'cookie'
import cookieParser from 'cookie-parser'
import { config } from 'dotenv'
import { and, eq } from 'drizzle-orm'
import express from 'express'

import { db } from './db/connection'
import { account } from './db/schema'
import { user } from './db/schema/user'

config({ path: '../../../.env' })

const PORT = process.env['PORT'] ?? 8080

const GITHUB_ID = process.env['GITHUB_ID'] ?? ''
const GITHUB_SECRET = process.env['GITHUB_SECRET'] ?? ''
const GOOGLE_ID = process.env['GOOGLE_ID'] ?? ''
const GOOGLE_SECRET = process.env['GOOGLE_SECRET'] ?? ''

/**
 * GitHub provider based on [Auth.js's implementation](https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/providers/github.ts)
 * Implemented in the core API.
 * Full Auth.js interop will also be offered in a separate library.
 */
const github = new OAuthProvider({
  id: 'github',
  clientId: GITHUB_ID,
  clientSecret: GITHUB_SECRET,
  endpoints: {
    authorization: {
      url: 'https://github.com/login/oauth/authorize',
      params: {
        client_id: GITHUB_ID,
        scope: 'read:user user:email',
      },
    },
    token: {
      url: 'https://github.com/login/oauth/access_token',
    },
    userinfo: {
      url: 'https://api.github.com/user',
      request: async ({ tokens, provider }) => {
        const profile = await fetch(provider.userinfo?.url, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'User-Agent': 'authjs',
          },
        }).then((response) => response.json())

        if (!profile.email) {
          /**
           * If the user does not have a public email, get another via the GitHub API
           * @see {https://docs.github.com/en/rest/users/emails#list-public-email-addresses-for-the-authenticated-user}
           */
          const response = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              'User-Agent': 'authjs',
            },
          })

          if (response.ok) {
            const emails = await response.json()
            profile.email = (emails.find((e: any) => e.primary) ?? emails[0]).email
          }
        }

        return profile
      },
    },
  },
  profile: (profile) => {
    return {
      id: profile.id.toString(),
      name: profile.name ?? profile.login,
      email: profile.email,
      image: profile.avatar_url,
    }
  },
})

const google = new OIDCProvider({
  id: 'google',
  clientId: GOOGLE_ID,
  clientSecret: GOOGLE_SECRET,
  issuer: 'https://accounts.google.com',
  endpoints: {
    authorization: {
      params: {
        client_id: GOOGLE_ID,
        response_type: 'code',
        scope: 'openid profile email',
      },
    },
  },
})

const adapter: Adapter = {
  findAccount: async (request, response) => {
    const existingAccounts = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.providerId, response.providerId),
          eq(account.providerAccountId, response.providerAccountId),
        ),
      )

    const existingAccount = existingAccounts[0]

    if (existingAccount === undefined) {
      console.error('Account not found')
      return
    }

    console.log('Account: ', response.account)
  },
  getUserFromAccount: (_account, _request, _response) => {
    return
  },
  createSession: (user, account, request, response) => {
    console.log('CREATING SESSION: ', user, account, request, response)
  },
  /**
   * Some accounts have an associated email,
   * and sometimes users can be uniquely identified by their email.
   *
   * Therefore, if both conditions are met,
   * an existing user might be identified even if the account doesn't exist yet.
   *
   * This database doesn't track user email, so noop.
   */
  findUser: (_request, _response) => {
    console.log('Database does not track user email, cannot find user if account does not exist')
    return
  },
  createUser: async (_request, response) => {
    const githubAccount = response.providerAccountMapping.github

    if (githubAccount !== undefined) {
      console.log('Creating user for github account: ', githubAccount)

      const newUsers = await db.insert(user).values([{}])

      const newUser = newUsers[0]

      if (newUser === undefined) {
        console.error('Failed to create user for account: ', response.providerAccountMapping)
        return
      }

      const newAccount = await db.insert(account).values([
        {
          providerId: response.providerId,
          providerAccountId: githubAccount.id,
          userId: `${newUser.insertId}`,
        },
      ])

      console.log('Account created: ', newAccount)

      return
    }

    console.error('Failed to create user for account: ', response.providerAccountMapping)
  },
  findUserAccounts: (user, request, response) => {
    console.log('FINDING USER ACCOUNTS: ', user, request, response)
  },
  createAccount: (user, request, response) => {
    console.log('CREATING ACCOUNT: ', user, request, response)
  },
  encodeSession: (session) => {
    console.log('ENCODING SESSION :', session)
  },
  decodeSession: (token) => {
    console.log('DECODING SESSION: ', token)
  },
}

const adapterPlugin = new AdapterPlugin(adapter)

const session = new JwtSessionPlugin()

const auth = new Auth({
  plugins: [github, google /*, session */, adapterPlugin],
})

async function main() {
  const result = await db.select().from(user)

  console.log({ result })

  const app = express()

  app.use(cookieParser())

  app.use(async (req, _res, next) => {
    const parsedSession = await session.parseSessionFromCookies(req.cookies)

    console.log({ parsedSession })

    next()
  })

  app.use(async (req, res, next) => {
    const request: Aponia.Request = {
      url: new URL(req.protocol + '://' + req.get('host') + req.originalUrl),
      method: req.method,
      cookies: req.cookies,
      headers: new Headers(),
    }

    const response = await auth.handle(request)

    if (response?.status != null) {
      res.status(response.status)
    }

    response?.cookies?.forEach((cookie) => {
      res.appendHeader('Set-Cookie', serialize(cookie.name, cookie.value, cookie.options))
    })

    if (response?.redirect != null) {
      res.redirect(response.redirect)
      return
    }

    if (response?.body != null) {
      res.send(response.body)
      return
    }

    if (response?.error != null) {
      res.send(response.error)
      return
    }

    next()
  })

  app.get('/', async (_req, res) => {
    res.send(`
<div>
<a href="/">Home</a>
<a href="/auth/login/github">Login with github</a>
<a href="/auth/login/google">Login with google</a>
</div>
`)
  })

  app.listen(PORT, () => {
    console.log(`Listening at http://localhost:${PORT} 🚀`)
  })
}

main()