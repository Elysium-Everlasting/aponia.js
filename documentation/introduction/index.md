---
title: Introduction
---

# Introduction

Aponia.js provides a flexible solution for handling authentication that
seamlessly integrates into any full-stack or backend framework.

```ts

```

## Features

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

// Example request object.
const request = {
  url: new URL('http://localhost:5173'),
  method: 'GET',
  cookies: {},
  headers: {},
}

github.login(request).then((response) => {
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
