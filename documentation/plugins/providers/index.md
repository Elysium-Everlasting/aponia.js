---
title: Provider Plugins
---

# Providers (OAuth/OIDC)

[[toc]]

## Core API

### GitHub Example (based on [auth.js](https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/providers/github.ts))

```ts
// src/auth/github.ts

import { OAuthProvider } from '@aponia.js/core/plugins/providers/oauth'

const github = new OAuthProvider({
  id: 'github',
  clientId: 'GITHUB_ID',
  clientSecret: 'GITHUB_SECRET',
  endpoints: {
    authorization: {
      url: 'https://github.com/login/oauth/authorize',
      params: {
        client_id: 'GITHUB_ID',
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
```

### Google Example

```ts
// src/auth/google.ts

import { OIDCProvider } from '@aponia.js/core/plugins/providers/oidc'

const google = new OIDCProvider({
  id: 'google',
  clientId: 'GOOGLE_ID',
  clientSecret: 'GOOGLE_SECRET',
  issuer: 'https://accounts.google.com',
  endpoints: {
    authorization: {
      params: {
        client_id: 'GOOGLE_ID',
        response_type: 'code',
        scope: 'openid profile email',
      },
    },
  },
})
```

::: tip

Depending on the desired OAuth provider, additional configuration may need to be defined
in order to assist in the OAuth process.

- `endpoints.authorization`: endpoint and params to use when generating the initial authorization URL.
- `endpoints.token`: endpoint and params to use during the callback to exchange the `code` for a `token`.
- `endpoints.userinfo`: how to get the user's account information with the `token`.
- `profile`: transform the account information received.

While OIDC providers also have these options, they can also be retrieved automatically
from the corresponding OIDC server.

:::


## Auth.js API

> Install required dependencies.

:::tabs
== npm
```bash
npm install @aponia.js/auth.js @auth/core
```

== yarn
```bash
yarn add @aponia.js/auth.js @auth/core
```

== pnpm
```bash
pnpm add @aponia.js/auth.js @auth/core
```

== bun
```bash
bun add @aponia.js/auth.js @auth/core
```
:::

The core framework is unopinionated and headless in initializing providers.
Pre-configured providers from external libraries can be imported and used to reduce boilerplate.

### Google and GitHub Example

```ts
// src/auth/providers.ts

import GitHub from '@auth/core/providers/github'
import Google from '@auth/core/providers/google'
import { OAuthProvider } from '@aponia.js/auth.js/providers/oauth'
import { OIDCProvider } from '@aponia.js/auth.js/providers/oidc'

const github = new OAuthProvider(
  GitHub({
    clientId: 'GITHUB_ID',
    clientSecret: 'GITHUB_SECRET',
  }),
)

const google = new OIDCProvider(
  Google({
    clientId: 'GOOGLE_ID',
    clientSecret: 'GOOGLE_SECRET',
  }),
)
```

### Benefits of wrapping `@auth/core`

Auth.js core API only exposes a subset of information that's retrieved during the OAuth process,
while Aponia.js aims to provide a more powerful API for building out custom auth solutions.

Aponia.js does not provide any pre-defined database schemas or connections,
but many templates and samples that can be easily copy/pasted and modified into existing projects.
