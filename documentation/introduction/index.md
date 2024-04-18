---
title: Introduction
---

# Introduction

Aponia.js provides a flexible solution for handling authentication that
seamlessly integrates into any full-stack or backend framework.


## Features

### Declarative Auth

Define all auth providers and flows in declarative manner,
independent of framework constraints.

:::tip
For frameworks that include file or directory based routing,
every OAuth provider requires a `/auth/login/{providerId}` and `/auth/callback/{providerId}` routes,
which do similar things but still require dedicated files.

**Aponia.js aims to remove this boilerplate**.
:::

```ts
// src/auth.ts

import { Auth } from '@aponia.js/core'
import { OIDCProvider } from '@aponia.js/auth.js/plugins/providers/oidc'

const provider1 = new OAuthProvider(/* ... */)

const provider2 = new OIDCProvider(/* ... */)

const auth = new Auth({
  plugins: [provider1, provider2],
})
```

::: tip
Providers add information to the response, but don't handle session creation or database interactions.
Add database interaction via an [adapter plugin](/plugins/adapter) and
session encoding/decoding via a [session plugin](/plugins/session).
:::

<hr>

### Seamless, Unopinionated Framework Integrations

Aponia.js handles the `/auth/login/{providerId}` and `/auth/callback/{providerId}` endpoints
by re-routing at the framework-handling level.

Aponia.js does not provide built-in framework adapters out of the box,
and the `Aponia.Response` returned by `auth.handle` provides a simple interface
for setting framework specific response objects.

:::tip

The endpoints that a provider handles is stored under `provider.pages`.

For example, an OAuth provider will handle the following pages if the request URL matches.

- Login `provider.pages.login`: The provider will generate a redirect response.
- Callback `provider.pages.callback`: The provider will generate authentication information in the internal response,
  which can be handled by session plugins or manually.
  [Read more about handling authentication information](/reference/authenticated-response)
- Redirect `provider.pages.redirect`: After generating the authentication information for a response callback,
  the provider can also append a redirect to the response.

:::

> Express.js example

```ts
// src/app.ts

import { Auth } from '@aponia.js/core'
import { OIDCProvider } from '@aponia.js/auth.js/plugins/providers/oidc'
import cookieParser from 'cookie-parser'
import express from 'express'

const provider1 = new OAuthProvider(/* ... */)

const provider2 = new OIDCProvider(/* ... */)

const auth = new Auth({
  plugins: [provider1, provider2],
})

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

  if (response?.status != null) {
    res.status(response.status)
  }

  response?.cookies?.forEach((cookie) => {
    res.cookie(cookie.name, cookie.value, { ...cookie.options })
  })

  if (response?.redirect != null) {
    res.redirect(response.redirect)
  } else if (response?.body != null) {
    res.send(response.body)
  } else if (response?.error != null) {
    res.send(response.error)
    return
  } else {
    next()
  }
})
```

::: warning
This example does not handle database interactions or session encoding,
it only demonstrates how login and callback routes are handled by the `auth.handle`
function.
:::

<hr>

### Headless Usage

Aponia.js classes all provide relevant methods for handling the OAuth process manually.

Here's an example of getting the authorization URL from a GitHub provider
after configuring it via `auth.js`.

```ts
// src/auth/github.ts

import GitHub from '@auth/core/providers/github'
import { OAuthProvider } from '@aponia.js/auth.js/providers/oauth'

export const github = new OAuthProvider(
  GitHub({
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
  }),
)

github.login().then((response) => {
  // The authorization URL that will initialize the OAuth process.
  const authorizationUrl = response.redirect

  // Any cookies to set, if needed. e.g. PKCE.
  const cookies = response.cookies

  // HTTP status, e.g. 302 for redirects.
  const status = response.status
})
```

::: info
Aponia.js does not provide pre-configured OAuth providers out of the box at the moment,
but features a flexible API for defining them,
and integrations for importing external provider configurations, e.g. from [`auth.js`](https://authjs.dev/).

[Read more about manually configuring providers](/providers/manual)

[Read more about integrations with external provider configurations](/providers/integrations)
:::
