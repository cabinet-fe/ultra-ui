import { resolve } from 'node:path'

import { NodePackageImporter } from 'sass-embedded'
import { defineConfig } from 'vite-plus'

const repoRoot = resolve(import.meta.dirname, '../..')

export default defineConfig({
  run: { tasks: { build: { command: 'vp pack', output: ['dist/**'] } } },

  pack: {
    entry: ['src/index.ts', 'src/**/style.ts'],
    platform: 'browser',
    format: ['esm'],
    unbundle: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
      neverBundle: ['@veltra/utils', '@veltra/styles', 'vue']
    },
    dts: true,
    css: {
      inject: true,
      preprocessorOptions: { scss: { importers: [new NodePackageImporter(repoRoot)] } }
    }
  }
})
