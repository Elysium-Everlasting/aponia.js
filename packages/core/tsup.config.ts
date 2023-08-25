import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  outDir: 'dist',
  format: ['cjs', 'esm'],
  clean: true,
  dts: true,
  bundle: true,
})
