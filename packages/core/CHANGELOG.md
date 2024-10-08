# @aponia.js/core

## 0.7.3

### Patch Changes

- 8444d43: feat: add enum for known code challenge methods

## 0.7.2

### Patch Changes

- 5850fe7: fix: resolve the authorization-server before determining pkce checks

## 0.7.1

### Patch Changes

- 279aa9b: chore(core): specify authorization-server overrides as partial

## 0.7.0

### Minor Changes

- ca4236d: feat(core): allow user to override values for authorization server

## 0.6.18

### Patch Changes

- b7ed1c7: feat(core): allow arbitrary data to exist on the base request object

## 0.6.17

### Patch Changes

- 8e1a575: fix(sveltekit): import types from SvelteKit

## 0.6.16

### Patch Changes

- 5cf673c: feat: providerAccountCredential in response

## 0.6.15

### Patch Changes

- d61f787: fix: allow request type

## 0.6.14

### Patch Changes

- 5b99b65: feat: allow optional response for auth handle

## 0.6.13

### Patch Changes

- 8e25f0b: chore: specify return type for adapter handle

## 0.6.12

### Patch Changes

- 00b5248: fix: wrong type definition

## 0.6.11

### Patch Changes

- d9c23ed: feat: also allow `Request` object for adapter handler

## 0.6.10

### Patch Changes

- f3f67da: feat: handle transforming regular Request objects

## 0.6.9

### Patch Changes

- e163f20: feat: only read custom origin in oauth/oidc callback

## 0.6.8

### Patch Changes

- 22d85f7: feat: origin auth option

## 0.6.7

### Patch Changes

- 6797434: feat: entrypoint for core library
- 568d948: revert: remove "skipChecks" option for oidc callback

## 0.6.6

### Patch Changes

- 2eae67d: feat: add option to skip checks during callback

## 0.6.5

### Patch Changes

- 44515a8: fix: sveltekit types

## 0.6.4

### Patch Changes

- c19a806: chore: remove function utilities from request object
- c19a806: fix: forward checks from auth.js options
  chore: remove adding functions to response

## 0.6.3

### Patch Changes

- bef47de: feat: sveltekit exports utility transform function
- 63c83c7: fix: forward checks from auth.js to core

## 0.6.2

### Patch Changes

- c22667c: chore: fix imports for sveltekit package

## 0.6.1

### Patch Changes

- d6fa227: feat: mark all adapter methods as optional

## 0.6.0

### Minor Changes

- 32c6149: feat: exclude config option

## 0.5.2

### Patch Changes

- f5412fa: feat: on logout callback

## 0.5.1

### Patch Changes

- 3b4aecc: feat: make cookie options deeply partial

## 0.5.0

### Minor Changes

- 8520fde: refactor: pass in explicit options for access and refresh tokens

## 0.4.4

### Patch Changes

- 8c2b6c2: fix types

## 0.4.3

### Patch Changes

- ef525d0: refactor: update types

## 0.4.2

### Patch Changes

- 5832787: feat: support cookie object with value
- 9cc8f58: refactor: get session and get refresh read cookies, not request

## 0.4.1

### Patch Changes

- b354159: feat: add transformer to regular request

  TODO: add general purpose transformer API

## 0.4.0

### Minor Changes

- 8481d76: feat: credentials plugin, logout plugin, session
- 40f7854: feat: logout plugin

## 0.3.2

### Patch Changes

- 2c8867e: chore: update auth.js/core version

## 0.3.1

### Patch Changes

- 78259cd: feat: qol updates

## 0.3.0

### Minor Changes

- 349b1ca: feat: updated examples and auth.js mvp demos
