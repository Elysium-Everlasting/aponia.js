import type { GoogleProfile } from '@auth/core/providers/google'

import { OIDCProvider, mergeOIDCOptions } from '../src/providers/oidc.js'
import type { OIDCDefaultConfig, OIDCUserConfig } from '../src/providers/oidc.js'

export const GoogleOptions: OIDCDefaultConfig<GoogleProfile> = {
  id: 'google',
  issuer: 'https://accounts.google.com',
}

export function Google(options: OIDCUserConfig<GoogleProfile>): OIDCProvider<GoogleProfile> {
  return new OIDCProvider(mergeOIDCOptions(options, GoogleOptions))
}
