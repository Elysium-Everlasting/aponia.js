import ci from 'ci-info'
import { defineConfig, type DefaultTheme } from 'vitepress'
import { tabsMarkdownPlugin } from 'vitepress-plugin-tabs'
import { repository } from '../package.json'

const repositoryName = repository.url.split('/').pop() ?? ''

/**
 * @see https://vitepress.dev/reference/default-theme-config
 */
const defaultTheme: DefaultTheme.Config = {
  sidebar: [
    {
      text: 'Introduction',
      link: '/introduction/',
    },
    {
      text: 'Get Started',
      link: '/introduction/get-started',
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
