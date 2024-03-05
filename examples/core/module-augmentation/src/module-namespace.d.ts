import type { LiteralUnion } from './types'

interface Extension {
  module_namespace: boolean
}

declare global {
  namespace Aponia {
    interface Request extends Extension {}

    interface AuthenticatedResponse extends Extension {
      /**
       * The value is enforced to be a string, and allows any string,
       * but it still provides autocomplete for specific literals like 'google'.
       */
      providerId: LiteralUnion<'google', string>
    }

    interface Response extends Extension {}

    interface User extends Extension {}

    interface Account extends Extension {}

    interface Session extends Extension {}

    interface Refresh extends Extension {}
  }
}
