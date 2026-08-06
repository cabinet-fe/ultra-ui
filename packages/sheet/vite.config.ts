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
    // canvas mock 等测试环境初始化已随 grid 迁至 sheet-core，跨包引用其 setup
    setupFiles: ['../sheet-core/src/grid/__test__/setup.ts'],
    globals: true,
    environment: 'happy-dom'
  },

  pack: {
    // import.worker.ts / export.worker.ts：xlsx 解析 / 序列化 worker（经
    // new Worker(new URL()) 引用，非 import 可达——unbundle 模式下必须显式
    // 列为 entry 才会编译进 dist）
    entry: [
      'src/index.ts',
      'src/vue/style.ts',
      'src/vue/popups/import.worker.ts',
      'src/tools/export.worker.ts'
    ],
    platform: 'browser',
    unbundle: true,
    sourcemap: false,
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
        '@veltra/icons',
        '@veltra/sheet-core',
        '@veltra/styles',
        '@veltra/utils',
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
