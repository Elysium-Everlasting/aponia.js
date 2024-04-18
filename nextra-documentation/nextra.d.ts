declare module 'nextra' {
  import type { NextConfig } from 'next'
  import type { NextraConfig, ThemeConfig } from 'nextra/types'

  type WithNextra = (config?: NextConfig) => NextConfig

  declare function nextra(
    themeOrNextraConfig?: ThemeConfig | NextraConfig,
    themeConfig?: ThemeConfig,
  ): WithNextra

  export default nextra
}
