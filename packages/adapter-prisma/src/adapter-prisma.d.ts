declare module '@auth/core/types' {
  interface Session {
    id: string
    refreshToken: string
  }
}

export {}
