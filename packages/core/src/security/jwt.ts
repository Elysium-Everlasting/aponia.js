import { hkdf } from '@panva/hkdf'
import { EncryptJWT, jwtDecrypt, type JWTPayload } from 'jose'

import { DAY_IN_SECONDS, KEY_INFO, SALT } from '../constants'
import { getTimestamp } from '../utils/get-timestamp'
import type { Awaitable, Nullish } from '../utils/types'

export interface JWTEncodeParams<T = Record<string, any>> {
  token?: T
  secret: string
  maxAge?: number
}

export interface JWTDecodeParams {
  token?: string
  secret: string
}

export interface JWTOptions {
  secret: string
  maxAge?: number
  encode?: (params: JWTEncodeParams) => Awaitable<string>
  decode?: <T>(params: JWTDecodeParams) => Awaitable<T | Nullish>
}

export const DEFAULT_JWT_OPTIONS: JWTOptions = { secret: 'secret' }

export async function getDerivedEncryptionKey(secret: string) {
  const derivedEncryptionKey = await hkdf('sha256', secret, SALT, KEY_INFO, 32)
  return derivedEncryptionKey
}

export async function encode<T extends Record<string, any> = Record<string, any>>(
  params: JWTEncodeParams<T>,
) {
  const encryptionSecret = await getDerivedEncryptionKey(params.secret)

  const encodedToken = await new EncryptJWT(params.token ?? {})
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(getTimestamp() + (params.maxAge ?? DAY_IN_SECONDS))
    .setJti(crypto.randomUUID())
    .encrypt(encryptionSecret)

  return encodedToken
}

export async function decode<T = Record<string, any>>(
  params: JWTDecodeParams,
): Promise<(T & JWTPayload) | Nullish> {
  if (params.token == null) {
    return null
  }

  const encryptionSecret = await getDerivedEncryptionKey(params.secret)

  const { payload } = await jwtDecrypt(params.token, encryptionSecret, { clockTolerance: 15 })

  return payload as T & JWTPayload
}
