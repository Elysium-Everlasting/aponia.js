import { useCallback } from 'react'

import { auth } from './lib/auth/client'
import { AuthProvider } from './lib/auth/provider'

export function App() {
  const login = useCallback(async (event: React.SyntheticEvent) => {
    event.preventDefault()
    await auth.login()
  }, [])

  const handle = useCallback(async (event: React.SyntheticEvent) => {
    event.preventDefault()
    await auth.handle()
  }, [])

  return (
    <AuthProvider>
      <div>
        <p>HELLO, WORLD!</p>
        <a href="/">HOME</a>
        <button onClick={login}>LOGIN</button>
        <button onClick={handle}>HANDLE</button>
      </div>
    </AuthProvider>
  )
}
