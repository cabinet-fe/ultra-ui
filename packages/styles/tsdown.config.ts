import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { NodePackageImporter } from 'sass-embedded'
import { defineConfig } from 'tsdown'

const dir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(dir, '../..')

export default defineConfig({
  entry: ['src/index.ts', 'src/theme/index.ts', 'src/normalize.ts'],

  treeshake: { moduleSideEffects: [{ test: /src\/index\.ts$/, sideEffects: true }] },
  format: ['esm'],
  unbundle: true,
  dts: true,
  platform: 'browser',
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  copy: [
    { from: 'src/*.scss', to: 'dist' },
    { from: 'src/anime/**/*.scss', to: 'dist/anime' }
  ],
  deps: { neverBundle: ['@veltra/utils', '@cat-kit/core', 'vue', '@veltra/compositions'] },
  css: {
    inject: true,
    preprocessorOptions: { scss: { importers: [new NodePackageImporter(repoRoot)] } }
  }
})
