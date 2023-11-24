import { Auth } from '@aponia.js/core'

import { google } from './google'
import { session } from './session'

export const auth = new Auth({
  session,
  providers: [google],
})
