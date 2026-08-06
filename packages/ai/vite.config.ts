import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { NodePackageImporter } from 'sass-embedded'
import unpluginVue from 'unplugin-vue/rolldown'
import { defineConfig } from 'vite-plus'

const repoRoot = resolve(import.meta.dirname, '../..')

export default defineConfig({
  // 仅供 Vitest 编译 SFC/TSX（测试会经 veltra-dev 拉入 desktop 源码）；`vp pack` 使用下方 pack.plugins。
  plugins: [vue(), vueJsx()],
  css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter(repoRoot)] } } },
  resolve: { conditions: ['veltra-dev', 'module', 'import', 'browser', 'default'] },

  run: { tasks: { build: { command: 'vp pack', output: ['dist/**'] } } },

  test: { include: ['src/**/*.test.ts'], globals: true, environment: 'happy-dom' },

  pack: {
    entry: ['src/index.ts', 'src/style.ts', 'src/components/**/style.ts'],
    platform: 'browser',
    format: ['esm'],
    unbundle: true,
    sourcemap: true,
    clean: true,
    treeshake: {
      moduleSideEffects: [{ test: /\/components\/[^/]+\/style\.ts$/, sideEffects: true }]
    },
    deps: {
      neverBundle: [
        'vue',
        'markstream-vue',
        '@veltra/utils',
        '@veltra/compositions',
        '@veltra/desktop',
        '@veltra/icons',
        '@veltra/styles'
      ]
    },
    dts: true,
    css: {
      inject: true,
      preprocessorOptions: { scss: { importers: [new NodePackageImporter(repoRoot)] } }
    },
    plugins: [unpluginVue({ isProduction: true })]
  }
})
