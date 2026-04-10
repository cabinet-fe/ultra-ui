import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/types/index.ts'],
  format: ['esm'],
  unbundle: true,
  dts: true,
  platform: 'neutral',
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  deps: { neverBundle: ['@cat-kit/core', 'vue'] }
})
