import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import { NodePackageImporter } from 'sass-embedded'
import unpluginVue from 'unplugin-vue/rolldown'
import { defineConfig } from 'vite-plus'

const repoRoot = resolve(import.meta.dirname, '../..')

const config = {
  // 仅供 Vitest 编译 SFC；`vp pack` 使用下方 pack.plugins。
  plugins: [vue()],
  css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter(repoRoot)] } } },
  resolve: { conditions: ['veltra-dev', 'module', 'import', 'browser', 'default'] },

  run: { tasks: { build: { command: 'vp pack', cache: { output: ['dist/**'] } } } },

  pack: {
    entry: ['src/index.ts', 'src/components/**/style.ts'],
    platform: 'browser',
    format: ['esm'],
    unbundle: true,
    sourcemap: true,
    clean: true,
    treeshake: {
      moduleSideEffects: [{ test: /\/components\/[^/]+\/style\.ts$/, sideEffects: true }]
    },
    deps: {
      alwaysBundle: [],
      onlyBundle: false,
      neverBundle: [
        'vue',
        '@veltra/utils',
        '@veltra/compositions',
        '@veltra/styles',
        '@veltra/icons',
        '@cat-kit/core'
      ]
    },
    dts: true,
    css: {
      inject: true,
      preprocessorOptions: { scss: { importers: [new NodePackageImporter(repoRoot)] } }
    },
    plugins: [unpluginVue({ isProduction: true })]
  }
}

export default defineConfig(config as Parameters<typeof defineConfig>[0])
