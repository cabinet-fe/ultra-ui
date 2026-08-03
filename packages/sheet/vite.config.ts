import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { NodePackageImporter } from 'sass-embedded'
import unpluginVue from 'unplugin-vue/rolldown'
import { defineConfig } from 'vite-plus'

const repoRoot = resolve(import.meta.dirname, '../..')

const config = {
  // 仅供 Vitest 编译 SFC/TSX（测试会经 veltra-dev 拉入 desktop 源码）；`vp pack` 使用下方 pack.plugins。
  plugins: [vue(), vueJsx()],
  css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter(repoRoot)] } } },
  resolve: { conditions: ['veltra-dev', 'module', 'import', 'browser', 'default'] },

  run: { tasks: { build: { command: 'vp pack', output: ['dist/**'] } } },

  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/grid/__test__/setup.ts'],
    globals: true,
    environment: 'happy-dom'
  },

  pack: {
    entry: ['src/index.ts', 'src/vue/style.ts'],
    platform: 'browser',
    unbundle: true,
    sourcemap: true,
    clean: true,
    treeshake: {
      moduleSideEffects: [
        { test: /\/vue\/style\.ts$/, sideEffects: true },
        { test: /\/tools\/builtin\.ts$/, sideEffects: true }
      ]
    },
    deps: {
      neverBundle: [
        '@cat-kit/core',
        'vue',
        '@veltra/desktop',
        '@veltra/styles',
        '@veltra/utils',
        '@visactor/vtable',
        '@visactor/vtable-editors',
        'hucre'
      ]
    },
    dts: { vue: true },
    css: {
      inject: true,
      preprocessorOptions: { scss: { importers: [new NodePackageImporter(repoRoot)] } }
    },
    plugins: [unpluginVue({ isProduction: true })]
  }
}

export default defineConfig(config as Parameters<typeof defineConfig>[0])
