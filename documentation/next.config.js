// @ts-check

import nextra from 'nextra'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
})

/**
 * @type{import('next').NextConfig}
 *
 * @see https://github.com/gregrickaby/nextjs-github-pages?tab=readme-ov-file#configure-nextjs
 */
const nextjsGithubPagesConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/aponia.js' : '',
  // assetPrefix: process.env.NODE_ENV === 'production' ? '/aponia.js/' : '',
  images: {
    unoptimized: true,
  },
}

/**
 * @type{import('next').NextConfig}
 */
const config = withNextra(nextjsGithubPagesConfig)

export default config
