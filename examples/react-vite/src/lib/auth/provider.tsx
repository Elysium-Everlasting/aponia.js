import { createContext, useEffect } from 'react'

import { auth } from './client'

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
