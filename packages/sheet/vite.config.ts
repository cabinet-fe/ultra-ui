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

  run: { tasks: { build: { command: 'vp pack', cache: { output: ['dist/**'] } } } },

  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/components/sheet/__test__/grid-setup.ts'],
    globals: true,
    environment: 'happy-dom',
    server: {
      deps: {
        // infinitable inline 进 vitest 模块图：externalize 时由 worker node 以
        // --conditions development 解析其传递依赖 @cat-kit/core，会命中
        // "development" → src/index.ts 导出条件，node_modules 下 TS 不可执行
        inline: ['infinitable']
      }
    }
  },

  pack: {
    // import.worker.ts / export.worker.ts：xlsx 解析 / 序列化 worker（经
    // new Worker(new URL()) 引用，非 import 可达——unbundle 模式下必须显式
    // 列为 entry 才会编译进 dist）
    entry: [
      'src/index.ts',
      'src/components/sheet/style.ts',
      'src/components/sheet/popups/import.worker.ts',
      'src/tools/export.worker.ts'
    ],
    platform: 'browser',
    unbundle: true,
    sourcemap: false,
    clean: true,
    treeshake: {
      moduleSideEffects: [
        { test: /\/components\/sheet\/style\.ts$/, sideEffects: true },
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
        /^infinitable(\/|$)/,
        '@veltra/styles',
        '@veltra/utils'
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
