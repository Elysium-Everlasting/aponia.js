import '@aponia.js/core/types'
import { OAuthProvider } from '@aponia.js/auth.js/providers/oauth'
import { OIDCProvider } from '@aponia.js/auth.js/providers/oidc'
import { Auth } from '@aponia.js/core/auth'
import { JwtSessionPlugin } from '@aponia.js/core/plugins/session/jwt'
import GitHub from '@auth/core/providers/github'
import Google from '@auth/core/providers/google'
import { serialize } from 'cookie'
import cookieParser from 'cookie-parser'
import { config } from 'dotenv'
import express from 'express'

config({ path: '../../../.env' })

const PORT = process.env['PORT'] ?? 8080

const GITHUB_ID = process.env['GITHUB_ID'] ?? ''
const GITHUB_SECRET = process.env['GITHUB_SECRET'] ?? ''
const GOOGLE_ID = process.env['GOOGLE_ID'] ?? ''
const GOOGLE_SECRET = process.env['GOOGLE_SECRET'] ?? ''

const github = GitHub({
  clientId: GITHUB_ID,
  clientSecret: GITHUB_SECRET,
})

const githubProviderPlugin = new OAuthProvider(github)

const google = Google({
  clientId: GOOGLE_ID,
  clientSecret: GOOGLE_SECRET,
})

const googleProviderPlugin = new OIDCProvider(google)

const session = new JwtSessionPlugin()

const auth = new Auth({
  plugins: [githubProviderPlugin, googleProviderPlugin, session],
})

function main() {
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
