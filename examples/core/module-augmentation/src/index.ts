import { type Adapter } from '@aponia.js/core/adapter'

export const adapter: Adapter = {
  findAccount: (request, response) => {
    request.ambient_declare_module
    response.ambient_declare_module

    request.ambient_namespace
    response.ambient_namespace

    request.module_namespace
    response.module_namespace

    response.providerId === 'google'
  },
  getUserFromAccount: (account, request, response) => {
    account.ambient_declare_module
    request.ambient_declare_module
    response.ambient_declare_module

    account.ambient_namespace
    request.ambient_namespace
    response.ambient_namespace

    account.module_namespace
    request.module_namespace
  },
  createSession: (user, account, request, response) => {
    user.ambient_declare_module
    account.ambient_declare_module
    request.ambient_declare_module
    response.ambient_declare_module

    user.ambient_namespace
    account.ambient_namespace
    request.ambient_namespace
    response.ambient_namespace

    user.module_namespace
    account.module_namespace
    request.module_namespace
    response.module_namespace
  },
  findUser: (request, response) => {
    request.ambient_declare_module
    response.ambient_declare_module

    request.ambient_namespace
    response.ambient_namespace

    request.module_namespace
    response.module_namespace
  },
  createUser: (request, response) => {
    request.ambient_declare_module
    response.ambient_declare_module

    request.ambient_namespace
    response.ambient_namespace

    request.module_namespace
    response.module_namespace
  },
  findUserAccounts: (user, request, response) => {
    user.ambient_declare_module
    request.ambient_declare_module
    response.ambient_declare_module

    user.ambient_namespace
    request.ambient_namespace
    response.ambient_namespace

    user.module_namespace
    request.module_namespace
    response.module_namespace
  },
  createAccount: (user, request, response) => {
    user.ambient_declare_module
    request.ambient_declare_module
    response.ambient_declare_module

    user.ambient_namespace
    request.ambient_namespace
    response.ambient_namespace

    user.module_namespace
    request.module_namespace
    response.module_namespace
  },
  encodeSession: (session) => {
    session.ambient_declare_module

    session.ambient_namespace

    session.module_namespace
  },
  decodeSession: (token) => {
    token
  },
}
