import { hkdf } from '@panva/hkdf'
import { EncryptJWT, jwtDecrypt, type JWTPayload } from 'jose'

import { KEY_INFO, SALT } from '../constants'
import type { Awaitable } from '../utils/types'

export interface JWTEncodeParams<T = Record<string, any>> {
  token: T
  secret: string
  maxAge?: number
}

export interface JWTDecodeParams {
  token: string
  secret: string
}

export interface JWTOptions {
  secret: string
  maxAge?: number
  encode?: (params: JWTEncodeParams) => Awaitable<string>
  decode?: (params: JWTDecodeParams) => Awaitable<any>
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

  const encodedToken = new EncryptJWT(params.token)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setJti(crypto.randomUUID())

  if (params.maxAge) {
    encodedToken.setExpirationTime(getTimestamp() + params.maxAge)
  }

  const token = await encodedToken.encrypt(encryptionSecret)

  return token
}

export async function decode<T = Record<string, any>>(
  params: JWTDecodeParams,
): Promise<(T & JWTPayload) | undefined> {
  const encryptionSecret = await getDerivedEncryptionKey(params.secret)

  const { payload } = await jwtDecrypt(params.token, encryptionSecret, { clockTolerance: 15 })

  return payload as T & JWTPayload
}

/**
 * Convert a Date to a Unix timestamp.
 *
 * @default Returns the current time as a timestamp.
 */
export function getTimestamp(time = Date.now()) {
  return (time / 1000) | 0
}
