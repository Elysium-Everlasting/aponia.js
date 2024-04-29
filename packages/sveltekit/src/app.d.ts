import '@aponia.js/core/types'

declare global {
  namespace Aponia {
    interface RequestInput {
      event: RequestEvent
    }
  }
}
