import { ClientAuth, SessionController } from '@aponia.js/core'
import Google from '@auth/core/providers/google'
import { createContext, useEffect } from 'react'

export const google: ReturnType<typeof Google> = Google({
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  // clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
  authorization: {
    params: {
      response_type: 'token',
    },
  },
})

const session = new SessionController()

export const auth = new ClientAuth({
  session,
  providers: [google],
})

const authContext = createContext(auth)

export type AuthProviderProps = {
  children: React.ReactNode
}

export function AuthProvider(props: AuthProviderProps) {
  useEffect(() => {
    const onPageLoad = auth.handle.bind(auth)

    window.addEventListener('load', onPageLoad)

    return () => {
      window.removeEventListener('load', onPageLoad)
    }
  }, [])

  return <authContext.Provider value={auth}>{props.children}</authContext.Provider>
}
