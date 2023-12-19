import crypto from 'node:crypto'

import { OAuthProvider } from '@aponia.js/core/providers/oauth'
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
})

function main() {
  const app = express()

  app.get('/', async (req, res) => {
    const response = await github.login({
      url: new URL(req.protocol + '://' + req.get('host') + req.originalUrl),
      method: req.method,
      cookies: req.cookies,
      headers: new Headers(),
      action: 'unknown',
    })

    console.log(response)

    res.send('Hello, World!')
  })

  app.listen(PORT, () => {
    console.log(`Listening at http://localhost:${PORT} 🚀`)
  })
}

main()
