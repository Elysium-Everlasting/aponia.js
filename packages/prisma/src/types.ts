import '@aponia.js/core/types'
import type { Awaitable, Nullish } from '@aponia.js/core/utils/types'

/**
 */
export interface DatabasePlugin {
  /**
   */
  findAccount: (response: Aponia.Response) => Awaitable<Aponia.Account | Nullish>

  /**
   */
  getUserFromAccount: (
    account: Aponia.Account,
    response: Aponia.Response,
  ) => Awaitable<Aponia.User | Nullish>

  /**
   */
  createSession: (
    user: Aponia.User,
    account: Aponia.Account,
    response: Aponia.Response,
  ) => Awaitable<any>

  /**
   */
  encodeSession: (session: Aponia.Session) => Awaitable<string>

  /**
   */
  findUser: (response: Aponia.Response) => Awaitable<Aponia.User | Nullish>

  /**
   */
  findUserAccounts: (user: Aponia.User, response: Aponia.Response) => Awaitable<Aponia.Account[]>

  /**
   */
  createUser: (response: Aponia.Response) => Awaitable<Aponia.User>

  /**
   */
  createAccount: (user: Aponia.User, response: Aponia.Response) => Awaitable<Aponia.Account>

  /**
   */
  handleUnlinkedAccount: (account: Aponia.Account, response: Aponia.Response) => Awaitable<any>

  /**
   */
  handleDuplicateAccount: (account: Aponia.Account[], response: Aponia.Response) => Awaitable<any>
}

/**
 */
export interface DatabaseRefreshPlugin {
  /**
   */
  getSessionFromRequest: (request: Aponia.Request) => Awaitable<Aponia.Session | Nullish>

  /**
   */
  refreshSession: (session: Aponia.Session, response: Aponia.Response) => Awaitable<any>

  /**
   */
  getRefreshFromRequest: (request: Aponia.Request) => Awaitable<string | Nullish>

  /**
   */
  encodeRefresh: (session: Aponia.Session) => Awaitable<string>

  /**
   */
  decodeRefresh: (refresh: string) => Awaitable<Aponia.Session | Nullish>

  /**
   */
  renewSession: (session: Aponia.Session, response: Aponia.Response) => Awaitable<any>
}
