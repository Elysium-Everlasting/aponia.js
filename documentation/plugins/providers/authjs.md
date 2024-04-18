---
title: Provider Plugins
---

# Auth.js OAuth/OIDC Provider API

[[toc]]

## Setup

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

## Google and GitHub Example

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
