// @ts-check

import { usePathname } from 'next/navigation'
import { useConfig } from 'nextra-theme-docs'

/**
 * @type{import('nextra').ThemeConfig}
 */
const config = {
  logo: <span>Aponia.js</span>,
  project: {
    link: 'https://github.com/elysium-everlasting/aponia.js',
  },
  head: () => {
    const pathname = usePathname()
    const { frontMatter } = useConfig()
    const url = `https://authjs.dev${pathname}`

    const lastPathParam = pathname.split('/').at(-1)?.replaceAll('-', ' ')

    const capitalizedPathTitle = lastPathParam?.replace(/\b\w/g, (l) => l.toUpperCase())

    const title = frontMatter['title']
      ? frontMatter['title']
      : capitalizedPathTitle
      ? `aponia.js | ${capitalizedPathTitle}`
      : 'aponia.js | Authentication'

    return (
      <>
        {/*
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        */}
        <title>{title}</title>
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={frontMatter['description'] ?? 'Authentication'} />
      </>
    )
  },
}

export default config
