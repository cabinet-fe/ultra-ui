import { resolve } from 'node:path'

import { NodePackageImporter } from 'sass-embedded'
import { defineConfig } from 'vite-plus'

const repoRoot = resolve(import.meta.dirname, '../..')

export default defineConfig({
  resolve: { conditions: ['veltra-dev', 'module', 'import', 'browser', 'default'] },

  test: { include: ['src/**/*.test.ts'], globals: true },

  pack: {
    entry: ['src/theme/index.ts', 'src/normalize/index.ts', 'src/transitions/index.ts'],
    platform: 'browser',
    format: ['esm'],
    unbundle: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    deps: { neverBundle: ['@veltra/utils', '@cat-kit/core', 'vue', '@veltra/compositions'] },
    dts: true,
    css: {
      inject: true,
      preprocessorOptions: { scss: { importers: [new NodePackageImporter(repoRoot)] } }
    },
    copy: [
      { from: 'src/*.scss', to: 'dist' },
      { from: 'src/transitions/**/*.scss', to: 'dist/transitions' }
    ]
  }
})
