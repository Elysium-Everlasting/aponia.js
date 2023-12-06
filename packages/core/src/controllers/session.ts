import type { PluginCoordinator } from '../plugin'
import type { Cookie } from '../security/cookie'
import type { Awaitable } from '../utils/types'

export abstract class SessionController {
  abstract createSessionFromUser(user: Aponia.User): Awaitable<Aponia.Session | undefined>

  abstract createCookiesFromSession(session: Aponia.Session): Awaitable<Cookie[]>

  abstract parseSessionFromCookies(
    cookies: Record<string, string>,
  ): Awaitable<Aponia.Session | undefined>

  abstract initialize?: (plugin: PluginCoordinator) => unknown
}
