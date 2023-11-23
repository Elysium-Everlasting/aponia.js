import { ClientAuth } from '@aponia.js/core/client'

import { google } from './google'
import { session } from './session'

export const auth = new ClientAuth({
  session,
  providers: [google],
})
