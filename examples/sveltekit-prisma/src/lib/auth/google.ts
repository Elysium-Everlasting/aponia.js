import { Google } from '@aponia.js/core/providers/google'

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private'

export const google = Google({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
})
