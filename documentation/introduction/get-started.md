---
title: Get Started
---

# Get Started

## Installation

Install the core module.

:::tabs
== npm

```bash
npm install @aponia.js/core
```

== yarn

```bash
yarn add @aponia.js/core
```

== pnpm

```bash
pnpm add @aponia.js/core
```

== bun

```bash
bun add @aponia.js/core
```

:::

## Create an `Auth` instance

```ts
// src/auth.ts
import { Auth } from '@aponia.js/core'

export const auth = new Auth()
```

## Add plugins

[Add provider plugins to handle callbacks](/plugins/providers/)

[Add session plugins to handle encoding/decoding](/plugins/session/)

[Add utility plugins to handle other requests](/plugins/utilities/)

[Add custom plugins to handle special usecases](/plugins/custom/)

## Integrate with backend

[SvelteKit](/integrations/sveltekit)

[Express.js](/integrations/express)

## Full Example

Source code can be found here

> SvelteKit

Initialize database.

```ts
// src/db.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
```

Create database adapter.

```ts
// src/adapter.ts

import { prisma } from './db'

export const adapter: Adapter = {
  findAccount: async (_request, response) => {
    return await prisma.account.findFirst({
      where: {
        providerId: response.providerId,
        providerAccountId: response.providerAccountId,
      },
    })
  },
  getUserFromAccount: async (account, _request, _response) => {
    return await prisma.user.findFirst({
      where: {
        id: account.userId,
      },
    })
  },
  createSession: async (user, _account, _request, _response) => {
    return await prisma.session.create({
      userId: user.id,
      expires: Date.now() + 1000 * 60 * 24,
    })
  },
  createUser: async (_request, response) => {
    return await prisma.user.create({
      name: response.account.name,
      avatar: response.account.picture ?? response.account['image'],
    })
  },
  findUserAccounts: async (user, _request, _response) => {
    return await prisma.account.findMany({
      where: {
        userId: user.id,
      },
    })
  },
  createAccount: async (user, _request, response) => {
    return await prisma.account.create({
      providerId: response.providerId,
      providerAccountId: response.providerAccountId,
      userId: user.id,
    })
  },
}
```

```ts
// src/hooks.server.ts

import { OAuthProvider } from '@aponia.js/auth.js/providers/oauth'
import { OIDCProvider } from '@aponia.js/auth.js/providers/oidc'
import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { GITHUB_ID, GITHUB_SECRET, GOOGLE_ID, GOOGLE_SECRET } from '$env/static/private'
import { adapter as rawAdapter } from './adapter'

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

const adapter = new AdapterPlugin(rawAdapter)

export const auth = new Auth({
  plugins: [github, google, adapter, jwt],
})

const authHandle: Handle = async ({ event, resolve }) => {
  const request: Aponia.RequestInput = {
    url: event.url,
    method: event.request.method,
    headers: event.request.headers,
    cookies: event.cookies,
    event,
  }

  const authResponse = await auth.handle(request)

  // `getSession` and `getRefresh` are only defined if a session plugin
  // was added to the auth instance for handling encoding/decoding cookies.

  event.locals.getSession ??= authResponse?.getSession
  event.locals.getRefresh ??= authResponse?.getRefresh
  event.locals.getUser = async () => {
    const cookieSession = await event.locals.getSession?.()

    if (cookieSession != null) {
      const dbSession = await prisma.session.findUnique({
        where: {
          id: cookieSession.id,
          expires: { gt: Date.now() },
        },
        include: {
          user: true,
        },
      })

      return dbSession?.user
    }
  }

  const response = auth.toResponse(authResponse) ?? resolve(event)

  return response
}

export const handle = sequence(authHandle)
```

::: tip
The database adapter only requires the minimum set of methods in order to coordinate
user, account, and session management within the OAuth flow.

It will not automatically handle functionality like deriving the user from the session.
:::


## More Examples

- SvelteKit + Auth.js + Drizzle
- SvelteKit + Core + Drizzle
- Express + Auth.js + Drizzle
- Express + Core + Drizzle