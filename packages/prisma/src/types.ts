import '@aponia.js/core/types'
import type { Awaitable, Nullish } from '@aponia.js/core/utils/types'

/**
 */
export interface DatabaseAdapter {
  /**
   */
  findAccount: (
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.Account | Nullish>

  /**
   */
  getUserFromAccount: (
    account: Aponia.Account,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.User | Nullish>

  /**
   */
  createSession: (
    user: Aponia.User,
    account: Aponia.Account,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<any>

  /**
   */
  encodeSession: (
    session: Aponia.Session,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<string>

  /**
   */
  findUser: (request: Aponia.Request, response: Aponia.Response) => Awaitable<Aponia.User | Nullish>

  /**
   */
  findUserAccounts: (
    user: Aponia.User,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.Account[]>

  /**
   */
  createUser: (request: Aponia.Request, response: Aponia.Response) => Awaitable<Aponia.User>

  /**
   */
  createAccount: (
    user: Aponia.User,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.Account>

  /**
   */
  handleUnlinkedAccount: (
    account: Aponia.Account,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<any>

  /**
   */
  handleMultipleAccount: (
    account: Aponia.Account[],
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<any>
}

/**
 */
export interface DatabaseRefreshAdapter {
  /**
   */
  getSessionFromRequest: (request: Aponia.Request) => Awaitable<Aponia.Session | Nullish>

  /**
   */
  refreshSession: (
    session: Aponia.Session,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<any>

  /**
   */
  getRefreshFromRequest: (request: Aponia.Request) => Awaitable<string | Nullish>

  /**
   */
  encodeRefresh: (
    session: Aponia.Session,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<string>

  /**
   */
  decodeRefresh: (
    refresh: string,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.Session | Nullish>

  /**
   */
  renewSession: (
    session: Aponia.Session,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<any>
}
