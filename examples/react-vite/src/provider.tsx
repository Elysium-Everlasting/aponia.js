import { ClientAuth } from '@aponia.js/core/client'
import { SessionManager } from '@aponia.js/core/session'
import { createContext } from 'react'

const session: SessionManager = new SessionManager({
  secret: '',
})

const auth = new ClientAuth({
  session,
  providers: [],
})

const authContext = createContext(auth)

export type AuthProviderProps = {
  children: React.ReactNode
}

export function AuthProvider(props: AuthProviderProps) {
  return <authContext.Provider value={auth}>{props.children}</authContext.Provider>
}
