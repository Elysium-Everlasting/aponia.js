import { OAuthProvider } from '@aponia.js/auth.js/providers/oauth'
import { OIDCProvider } from '@aponia.js/auth.js/providers/oidc'
import { type Adapter, AdapterPlugin } from '@aponia.js/core/adapter'
import { Auth } from '@aponia.js/core/auth'
import { JwtSessionPlugin } from '@aponia.js/core/plugins/session/jwt'
import GitHub from '@auth/core/providers/github'
import Google from '@auth/core/providers/google'
import { serialize } from 'cookie'
import cookieParser from 'cookie-parser'
import { config } from 'dotenv'
import { and, eq } from 'drizzle-orm'
import express from 'express'

import { db } from './db/connection'
import { account } from './db/schema'
import { session } from './db/schema/session'
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
const github = new OAuthProvider(
  GitHub({
    clientId: GITHUB_ID,
    clientSecret: GITHUB_SECRET,
  }),
)

const google = new OIDCProvider(
  Google({
    clientId: GOOGLE_ID,
    clientSecret: GOOGLE_SECRET,
  }),
)

const adapter: Adapter = {
  findAccount: async (_request, response) => {
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
      console.error('Existing account not found')
      return
    }

    console.log('Found existing account: ', existingAccount)
    return existingAccount
  },
  getUserFromAccount: async (account, _request, _response) => {
    const [existingUser] = await db.select().from(user).where(eq(user.id, account.userId))

    if (existingUser == null) {
      console.error('Failed to find existing user for account: ', account)
      return
    }

    return existingUser
  },
  createSession: async (user, account, _request, _response) => {
    const [newSession] = await db
      .insert(session)
      .values([
        {
          userId: user.id,
        },
      ])
      .returning()

    if (newSession == null) {
      console.error(`Failed to create new session for user: ${user} and account: ${account}`)
      return
    }

    return newSession
  },
  findUser: (_request, _response) => {
    console.log('Database does not track user email, cannot find user if account does not exist')
    return
  },
  createUser: async (_request, response) => {
    const githubAccount = response.providerAccountMapping.github

    if (githubAccount !== undefined) {
      console.log('Creating user for github account: ', githubAccount)

      const [newUser] = await db.insert(user).values([{}]).returning()

      if (newUser === undefined) {
        console.error('Failed to create user for account: ', response.providerAccountMapping)
        return
      }

      return newUser
    }

    const googleAccount = response.providerAccountMapping.google

    if (googleAccount != null) {
      console.log('Creating user for google account: ', googleAccount)

      const [newUser] = await db.insert(user).values([{}]).returning()

      if (newUser === undefined) {
        console.error('Failed to create user for account: ', response.providerAccountMapping)
        return
      }

      return newUser
    }

    console.error('Failed to create user for account: ', response.providerAccountMapping)
    return
  },
  findUserAccounts: async (user, _request, _response) => {
    const userAccounts = await db
      .select()
      .from(account)
      .where(and(eq(account.userId, user.id)))

    return userAccounts
  },
  createAccount: async (user, _request, response) => {
    const [newAccount] = await db
      .insert(account)
      .values([
        {
          providerId: response.providerId,
          providerAccountId: response.providerAccountId,
          userId: user.id,
        },
      ])
      .returning()

    if (newAccount == null) {
      console.error('Failed to create new account for ', user)
      return
    }

    console.log('Account created: ', newAccount)
    return newAccount
  },
  encodeSession: async (session) => {
    const encodedSession = await jwtSession.encode(session)
    return encodedSession
  },
  decodeSession: async (token) => {
    const decodedSession = await jwtSession.decode(token)
    return decodedSession
  },
}

const adapterPlugin = new AdapterPlugin(adapter)

const jwtSession = new JwtSessionPlugin()

const auth = new Auth({
  plugins: [github, google /*, session */, adapterPlugin],
})

async function main() {
  const app = express()

  app.use(cookieParser())

  app.use(async (req, _res, next) => {
    const parsedSession = await jwtSession.parseSessionFromCookies(req.cookies)

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
