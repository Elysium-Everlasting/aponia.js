import crypto from 'node:crypto'

import { Auth } from '@aponia.js/core/auth'
import { OAuthProvider } from '@aponia.js/core/providers/oauth'
import { serialize } from 'cookie'
import cookieParser from 'cookie-parser'
import { config } from 'dotenv'
import express from 'express'

globalThis.crypto = crypto as typeof globalThis.crypto

config({
  path: '../../../.env',
})

const PORT = process.env['PORT'] ?? 8080

const github = new OAuthProvider({
  id: 'github',
  clientId: process.env['GITHUB_ID'] ?? '',
  clientSecret: process.env['GITHUB_SECRET'] ?? '',
  endpoints: {
    authorization: {
      url: 'https://github.com/login/oauth/authorize',
      params: { scope: 'read:user user:email' },
    },
    token: {
      url: 'https://github.com/login/oauth/access_token',
    },
    userinfo: {
      url: 'https://api.github.com/user',
      async request({ tokens, provider }) {
        const profile = await fetch(provider.userinfo?.url, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'User-Agent': 'authjs',
          },
        }).then(async (res) => await res.json())

        if (!profile.email) {
          // If the user does not have a public email, get another via the GitHub API
          // See https://docs.github.com/en/rest/users/emails#list-public-email-addresses-for-the-authenticated-user
          const res = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              'User-Agent': 'authjs',
            },
          })

          if (res.ok) {
            const emails = await res.json()
            profile.email = (emails.find((e: any) => e.primary) ?? emails[0]).email
          }
        }

        return profile
      },
    },
  },
  profile(profile) {
    return {
      id: profile.id.toString(),
      name: profile.name ?? profile.login,
      email: profile.email,
      image: profile.avatar_url,
    }
  },
})

const auth = new Auth({
  handlers: [github],
})

function main() {
  const app = express()

  app.use(cookieParser())

  app.use(async (req, res, next) => {
    const request: Aponia.Request = {
      url: new URL(req.protocol + '://' + req.get('host') + req.originalUrl),
      method: req.method,
      cookies: req.cookies,
      headers: new Headers(),
    }

    const response = await auth.handle(request)

    if (response.status != null) {
      res.status(response.status)
    }

    response.cookies?.forEach((cookie) => {
      res.appendHeader('Set-Cookie', serialize(cookie.name, cookie.value, cookie.options))
    })

    if (response.redirect != null) {
      res.redirect(response.redirect)
      return
    }

    if (response.body != null) {
      res.send(response.body)
      return
    }

    if (response.error != null) {
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
</div>
`)
  })

  app.listen(PORT, () => {
    console.log(`Listening at http://localhost:${PORT} 🚀`)
  })
}

main()
