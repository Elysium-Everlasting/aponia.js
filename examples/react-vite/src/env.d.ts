import 'vite/client'

declare global {
  interface ImportMetaEnv {
    readonly VITE_GOOGLE_CLIENT_ID: string
    readonly VITE_GOOGLE_CLIENT_SECRET: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

export {}
