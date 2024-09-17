import '@aponia.js/core/types'
import type { RequestEvent } from '@sveltejs/kit'

declare global {
  namespace Aponia {
    interface Request {
      event: RequestEvent
    }
  }
}
