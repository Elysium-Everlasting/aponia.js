// @ts-check

import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'

export const config = defineConfig({
  plugins: [sveltekit()],
})

export default config
