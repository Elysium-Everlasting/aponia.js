import type { Logger } from '../logger'
import type { CreateCookiesOptions } from '../security/cookie'
import type { AponiaRequest, AponiaResponse } from '../types'
import type { Awaitable, Nullish } from '../utils/types'

export interface Plugin {
  initialize: (register: PluginRegister, options: PluginOptions) => Awaitable<void>
}

export interface PluginRegister {
  pre: PluginRegisterPre
  handle: PluginRegisterHandle
  post: PluginRegisterPost
}

// This could be accomplished with a generic, but I'm not sure if they'll always all have the same options

export type PluginRegisterPre = (
  route: PluginRoute,
  handler: PluginPre,
  options?: PluginOptions,
) => void

export type PluginRegisterHandle = (
  route: PluginRoute,
  handler: PluginHandle,
  options?: PluginOptions,
) => void

export type PluginRegisterPost = (
  route: PluginRoute,
  handler: PluginPost,
  options?: PluginOptions,
) => void

export type PluginPre = (request: AponiaRequest) => Awaitable<AponiaResponse | Nullish>

export type PluginHandle = (request: AponiaRequest) => Awaitable<AponiaResponse | Nullish>

export type PluginPost = (
  request: AponiaRequest,
  response: AponiaResponse,
) => Awaitable<AponiaRequest | Nullish>

export interface PluginOptions {
  matchFn?: (request: AponiaRequest) => Awaitable<boolean>
  cookieOptions?: CreateCookiesOptions
  logger?: Logger
}

export type PluginRoute = string | RegExp
