import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { NodePackageImporter } from 'sass-embedded'
import { defineConfig } from 'tsdown'

const dir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(dir, '../..')

export default defineConfig({
  entry: ['src/index.ts', 'src/theme/index.ts'],
  format: ['esm'],
  unbundle: true,
  dts: true,
  platform: 'browser',
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  deps: { neverBundle: ['@veltra/utils', '@cat-kit/core', 'vue', '@veltra/compositions'] },
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler', importers: [new NodePackageImporter(repoRoot)] }
    }
  }
})
