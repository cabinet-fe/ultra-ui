import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: {
    entry: ['src/index.ts'],
    platform: 'browser',
    format: ['esm'],
    unbundle: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    deps: {
      neverBundle: ['@veltra/utils', '@cat-kit/core', '@cat-kit/fe', 'vue', '@floating-ui/dom']
    },
    dts: true
  }
})
