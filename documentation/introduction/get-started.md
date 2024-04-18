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

[add provider plugins to handle callbacks](/plugins/providers)

[add session plugins to handle encoding/decoding](/plugins/session)

[add utility plugins to handle other requests](/plugins/utilities)

[add custom plugins to handle special usecases](/plugins/custom)

## Integrate with backend

[SvelteKit](/integrations/sveltekit)

[Express.js](/integrations/express)
