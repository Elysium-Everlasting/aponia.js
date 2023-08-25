import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {},
  format: ['cjs', 'esm'],
  clean: true,
  dts: true,
  bundle: true,
})
