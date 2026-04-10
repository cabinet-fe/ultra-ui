import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { NodePackageImporter } from 'sass-embedded'
import { defineConfig } from 'tsdown'

const dir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(dir, '../..')

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  unbundle: true,
  dts: true,
  platform: 'browser',
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler', importers: [new NodePackageImporter(repoRoot)] }
    }
  }
})
