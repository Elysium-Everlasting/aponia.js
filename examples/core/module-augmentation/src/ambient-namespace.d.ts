interface Extension {
  ambient_namespace: boolean
}

namespace Aponia {
  interface Request extends Extension { }

  interface AuthenticatedResponse extends Extension { }

  interface Response extends Extension { }

  interface User extends Extension { }

  interface Account extends Extension { }

  interface Session extends Extension { }

  interface Refresh extends Extension { }
}
