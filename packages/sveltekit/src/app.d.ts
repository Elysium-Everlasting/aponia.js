import '@aponia.js/core/types'

declare global {
  namespace Aponia {
    interface Request {
      event: RequestEvent
    }
  }
}
