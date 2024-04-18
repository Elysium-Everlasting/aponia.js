import ci from 'ci-info'
import { defineConfig, type DefaultTheme } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import { repository } from '../package.json'

const repositoryName = repository.url.split('/').pop() ?? ''

/**
 * @see https://vitepress.dev/reference/default-theme-config
 */
const defaultTheme: DefaultTheme.Config = {
  socialLinks: [
    {
      link: 'https://github.com:elysium-everlasting/aponia.js',
      icon: 'github',
    },
  ],
  sidebar: [
    {
      text: 'Introduction',
      link: '/introduction/',
    },
    {
      text: 'Get Started',
      link: '/introduction/get-started',
    },
    {
      text: 'Plugins',
      items: [
        {
          text: 'Providers',
          link: '/plugins/providers/',
          items: [
            {
              text: 'Core',
              link: '/plugins/providers/core',
            },
            {
              text: 'Auth.js',
              link: '/plugins/providers/authjs',
            },
          ],
        },
        {
          text: 'Session',
          link: '/plugins/session/',
        },
      ],
    },
    {
      text: 'Reference',
      items: [
        {
          text: 'Flow',
          link: '/reference/flow',
        },
      ],
    },
    {
      text: 'Samples',
      items: [
        {
          text: 'Flow',
          link: '/reference/flow',
        },
      ],
    },
  ],
}

/**
 * @see https://vitepress.dev/reference/site-config
 */
export default defineConfig({
  title: 'Aponia.js',

  description: 'Authentication',

  themeConfig: defaultTheme,

  base: ci.GITHUB_ACTIONS ? `/${repositoryName.replace('.git', '')}/` : '',

  markdown: {
    config: (md) => {
      md.use(tabsMarkdownPlugin)
    },
  },
})
