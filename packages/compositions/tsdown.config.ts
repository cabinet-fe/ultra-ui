import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  unbundle: true,
  dts: true,
  platform: 'browser',
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  deps: {
    neverBundle: ['@veltra/utils', '@cat-kit/core', '@cat-kit/fe', 'vue', '@floating-ui/dom']
  }
})
