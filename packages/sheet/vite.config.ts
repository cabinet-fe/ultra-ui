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
    // import.worker.ts：xlsx 解析 worker（import-popup 经 new Worker(new URL()) 引用，
    // 非 import 可达——unbundle 模式下必须显式列为 entry 才会编译进 dist）
    entry: ['src/index.ts', 'src/vue/style.ts', 'src/vue/popups/import.worker.ts'],
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
        '@cat-kit/fe',
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
