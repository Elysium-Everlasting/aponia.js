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
    { text: 'Examples', link: '/markdown-examples' },
  ],

  sidebar: [
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
  title: 'My Awesome Project',

  description: 'A VitePress Site',

  themeConfig: defaultTheme,

  base: ci.GITHUB_ACTIONS ? `/${repositoryName.replace('.git', '')}/` : '',
})
