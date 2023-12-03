import { defineConfig, type DefaultTheme } from 'vitepress'
import { repository } from '../../../package.json'
import ci from 'ci-info'

const repositoryName = repository.url.split('/').pop() ?? ''

/**
 * @see https://vitepress.dev/reference/default-theme-config
 */
const defaultTheme: DefaultTheme.Config = {
  nav: [
    { text: 'Home', link: '/' },
    { text: 'Reference', link: '/reference/index' },
  ],

  sidebar: [
    {
      text: '@aponia.js/core',
      link: '/core/index',
    },
    {
      text: 'Adapters',
      link: '/adapters/index',
      items: [
        {
          text: '@aponia.js/adapter-prisma',
          items: [
            {
              text: 'Getting Started',
              link: '/adapters/prisma/index',
              items: [],
            },
          ],
        },
      ],
    },
    {
      text: 'Integrations',
      link: '/integrations/index',
      items: [
        {
          text: '@aponia.js/sveltekit',
          items: [
            {
              text: 'Getting Started',
              link: '/integrations/sveltekit/index',
            },
          ],
        },
      ],
    },
    {
      text: 'Examples',
      items: [
        { text: 'Markdown Examples', link: '/markdown-examples' },
        { text: 'Runtime API Examples', link: '/api-examples' },
      ],
    },
  ],

  socialLinks: [{ icon: 'github', link: 'https://github.com/vuejs/vitepress' }],
}

/**
 * @see https://vitepress.dev/reference/site-config
 */
export default defineConfig({
  title: 'Aponia.js',

  description: 'Blessed authentication',

  themeConfig: defaultTheme,

  base: ci.GITHUB_ACTIONS ? `/${repositoryName.replace('.git', '')}/` : '',
})
