import './types'
import { DEFAULT_COOKIE_NAME, DEFAULT_SECURE_PREFIX } from './constants'
import type { Plugin, PluginContext, PluginOptions } from './plugins/plugin'
import type { CookieSerializeOptions } from './security/cookie'
import type { Awaitable, Nullish } from './utils/types'

export const DEFAULT_SESSION_COOKIE_NAME = 'session'
export const DEFAULT_REFRESH_COOKIE_NAME = 'refresh'

/**
 * Basic adapter for handling a standard authentication flow.
 */
export interface Adapter {
  /**
   * 1. A provider responds with a user's credentials.
   * 2. Find the corresponding account that was logged in to.
   */
  findAccount: (
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.Account | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. No account was found.
   * 3. Find the user that owns the account.
   */
  getUserFromAccount: (
    account: Aponia.Account,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.User | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. An account is (eventually) found.
   * 3. A user that owns the account is (eventually) found.
   * 4. Create a new session.
   *
   * Accounts and users may be created/found in different ways.
   */
  createSession: (
    user: Aponia.User,
    account: Aponia.Account,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.Session | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. No account was found.
   * 3. Find a user that is associated with the credentials.
   */
  findUser: (request: Aponia.Request, response: Aponia.Response) => Awaitable<Aponia.User | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. No account was found.
   * 3. No user with the credentials is found.
   * 4. Create a new user.
   *
   * @remarks Do not create an account for the user too; this will be handled later.
   */
  createUser: (
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.User | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. No account was found.
   * 3. A user with the credentials is found, or newly created with the credentials.
   * 4. Find all accounts that the user has.
   */
  findUserAccounts: (
    user: Aponia.User,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.Account[] | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. No account was found.
   * 3. A user with the credentials is found, or newly created with the credentials.
   * 4. Find all accounts that the user has.
   */
  handleMultipleAccount: (
    user: Aponia.User,
    account: Aponia.Account[],
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.Account | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. No account was found.
   * 3. A user is either found or created.
   * 4. The found user doesn't have any accounts.
   * 5. Create a new account for the user.
   */
  createAccount: (
    user: Aponia.User,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.Account | Nullish>

  /**
   * 1. A provider responds with a user's credentials.
   * 2. An account was found.
   * 3. No user is found that owns the account.
   */
  handleUnboundAccount: (
    account: Aponia.Account,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<any>

  /**
   */
  encodeSession: (session: Aponia.Session) => Awaitable<string>
}

/**
 * Supplemental adapter for refreshing sessions.
 * (PRE) indicates that the method is called before any provider handling.
 * (POST) indicates that the method is called after any provider handling.
 */
export interface RefreshAdapter {
  /**
   * (PRE)
   * Get the session from the request.
   */
  getSessionFromRequest: (request: Aponia.Request) => Awaitable<Aponia.Session | Nullish>

  /**
   * (PRE)
   * 1. No session is found in the request.
   * 2. Get the refresh token from the request.
   */
  getRefreshFromRequest: (request: Aponia.Request) => Awaitable<string | Nullish>

  /**
   * (PRE)
   * 1. No session is found in the request.
   * 2. Get the refresh token from the request.
   * 3. Decode the refresh token.
   */
  decodeRefresh: (refresh: string, request: Aponia.Request) => Awaitable<Aponia.Refresh | Nullish>

  /**
   * (PRE)
   * 1. No session is found in the request.
   * 2. Get the refresh token from the request.
   * 3. Decode the refresh token.
   * 4. Refresh the session.
   */
  renewSession: (
    refresh: Aponia.Refresh,
    request: Aponia.Request,
  ) => Awaitable<Aponia.Session | Nullish>

  /**
   * (POST)
   */
  createRefresh: (
    session: Aponia.Session,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<Aponia.Refresh | Nullish>

  /**
   */
  encodeRefresh: (
    refresh: Aponia.Refresh,
    request: Aponia.Request,
    response: Aponia.Response,
  ) => Awaitable<string>
}

export interface AdapterPluginOptions extends PluginOptions {
  /**
   */
  sessionSerializeOptions?: CookieSerializeOptions

  /**
   * @default {@link DEFAULT_SESSION_COOKIE_NAME}
   */
  sessionName?: string

  /**
   */
  refreshSerializeOptions?: CookieSerializeOptions

  /**
   * @default {@link DEFAULT_REFRESH_COOKIE_NAME}
   */
  refreshName?: string
}

/**
 */
export class AdapterPlugin implements Plugin {
  adapter: Adapter

  refresh?: RefreshAdapter

  options: AdapterPluginOptions

  sessionIsSecure: boolean

  refreshIsSecure: boolean

  sessionSecurePrefix: string

  refreshSecurePrefix: string

  cookieNamePrefix: string

  sessionCookieName: string

  refreshCookieName: string

  constructor(adapter: Adapter, refresh?: RefreshAdapter, options: AdapterPluginOptions = {}) {
    this.adapter = adapter
    this.refresh = refresh
    this.options = options
    this.sessionIsSecure = options.sessionSerializeOptions?.secure ?? false
    this.refreshIsSecure = options.refreshSerializeOptions?.secure ?? false
    this.sessionSecurePrefix = this.sessionIsSecure ? DEFAULT_SECURE_PREFIX : ''
    this.refreshSecurePrefix = this.refreshIsSecure ? DEFAULT_SECURE_PREFIX : ''
    this.cookieNamePrefix = options.cookieOptions?.name ?? DEFAULT_COOKIE_NAME
    this.sessionCookieName = options.sessionName ?? DEFAULT_SESSION_COOKIE_NAME
    this.refreshCookieName = options.refreshName ?? DEFAULT_REFRESH_COOKIE_NAME
  }

  initialize(context: PluginContext, options: AdapterPluginOptions) {
    this.options = { ...this.options, ...options }

    if (options.cookieOptions?.serialize?.secure != null) {
      this.sessionIsSecure = options.cookieOptions.serialize.secure
      this.refreshIsSecure = options.cookieOptions.serialize.secure
    }

    if (options.sessionSerializeOptions?.secure != null) {
      this.sessionIsSecure = options.sessionSerializeOptions.secure
    }

    if (options.refreshSerializeOptions?.secure != null) {
      this.refreshIsSecure = options.refreshSerializeOptions.secure
    }

    this.sessionSecurePrefix = this.sessionIsSecure ? DEFAULT_SECURE_PREFIX : ''
    this.refreshSecurePrefix = this.refreshIsSecure ? DEFAULT_SECURE_PREFIX : ''
    this.cookieNamePrefix = options.cookieOptions?.name ?? this.cookieNamePrefix
    this.sessionCookieName = options.sessionName ?? this.sessionCookieName
    this.refreshCookieName = options.refreshName ?? this.refreshCookieName
    context.router.postHandle(this.handle.bind(this))
  }

  async handle(request: Aponia.Request, response?: Aponia.Response) {
    if (
      response?.providerId == null ||
      response.providerType == null ||
      response.providerAccountId == null
    ) {
      return
    }

    let account = await this.adapter.findAccount(request, response)

    if (account != null) {
      const user = await this.adapter.getUserFromAccount(account, request, response)

      if (user == null) {
        return await this.adapter.handleUnboundAccount(account, request, response)
      }

      const session = await this.adapter.createSession(user, account, request, response)

      return session != null
        ? await this.createSessionResponse(session, request, response)
        : undefined
    }

    let user = await this.adapter.findUser(request, response)

    if (user == null) {
      user = await this.adapter.createUser(request, response)
    }

    if (user == null) {
      return
    }

    const accounts = await this.adapter.findUserAccounts(user, request, response)

    if (accounts?.length) {
      account = await this.adapter.handleMultipleAccount(user, accounts, request, response)

      if (account == null) {
        return
      }
    }

    account = await this.adapter.createAccount(user, request, response)

    if (account == null) {
      return
    }

    const session = await this.adapter.createSession(user, account, request, response)

    return session != null
      ? await this.createSessionResponse(session, request, response)
      : undefined
  }

  async createSessionResponse(
    session: Aponia.Session,
    request: Aponia.Request,
    response: Aponia.Response,
  ): Promise<Aponia.Response> {
    const sessionValue = await this.adapter.encodeSession(session)
    const sessionName = `${this.sessionSecurePrefix}${this.cookieNamePrefix}.${this.sessionCookieName}`

    const sessionResponse: Aponia.Response = {}
    sessionResponse.cookies ??= []

    sessionResponse.cookies.push({
      name: sessionName,
      value: sessionValue,
      options: {
        ...this.options.cookieOptions?.serialize,
        ...this.options.sessionSerializeOptions,
      },
    })

    if (this.refresh == null) return sessionResponse

    const refresh = await this.refresh.createRefresh(session, request, response)

    if (refresh == null) {
      return sessionResponse
    }

    const refreshValue = await this.refresh.encodeRefresh(refresh, request, response)

    if (refreshValue == null) return sessionResponse

    const refreshName = `${this.refreshSecurePrefix}${this.cookieNamePrefix}.${this.refreshCookieName}`

    sessionResponse.cookies.push({
      name: refreshName,
      value: refreshValue,
    })

    return sessionResponse
  }
}

export function createAdapterPlugin(adapter: Adapter): Plugin {
  return new AdapterPlugin(adapter)
}
