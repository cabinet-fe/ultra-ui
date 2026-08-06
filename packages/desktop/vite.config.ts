import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { NodePackageImporter } from 'sass-embedded'
import unpluginVueJsx from 'unplugin-vue-jsx/rolldown'
import unpluginVue from 'unplugin-vue/rolldown'
import { defineConfig } from 'vite-plus'

const repoRoot = resolve(import.meta.dirname, '../..')

const config = {
  // 仅供 Vitest 编译 SFC；`vp pack` 使用下方 pack.plugins。
  plugins: [vue(), vueJsx()],
  css: { preprocessorOptions: { scss: { importers: [new NodePackageImporter(repoRoot)] } } },
  resolve: { conditions: ['veltra-dev', 'module', 'import', 'browser', 'default'] },

  run: { tasks: { build: { command: 'vp pack', output: ['dist/**'] } } },

  test: { include: ['src/**/*.test.ts'], globals: true, environment: 'happy-dom' },

  pack: {
    entry: ['src/index.ts', 'src/install.ts', 'src/style.ts', 'src/components/**/style.ts'],
    platform: 'browser',
    format: ['esm'],
    unbundle: true,
    sourcemap: true,
    clean: true,
    treeshake: {
      moduleSideEffects: [{ test: /\/components\/[^/]+\/style\.ts$/, sideEffects: true }]
    },
    deps: {
      alwaysBundle: [/^@codemirror\//, /^@lezer\//, 'style-mod'],
      onlyBundle: false,
      neverBundle: [
        'vue',
        '@veltra/utils',
        '@veltra/compositions',
        '@veltra/directives',
        '@veltra/styles',
        '@veltra/icons',
        '@veltra/sheet-core',
        '@cat-kit/core',
        '@embedpdf/core',
        '@embedpdf/engines',
        '@embedpdf/plugin-document-manager',
        '@embedpdf/plugin-render',
        '@embedpdf/plugin-scroll',
        '@embedpdf/plugin-viewport',
        '@embedpdf/plugin-zoom',
        '@lexical/clipboard',
        '@lexical/history',
        '@lexical/html',
        '@lexical/link',
        '@lexical/list',
        '@lexical/rich-text',
        '@lexical/selection',
        '@lexical/utils',
        'codemirror',
        'docx-preview',
        'lexical'
      ]
    },
    dts: { vue: true },
    css: {
      inject: true,
      preprocessorOptions: { scss: { importers: [new NodePackageImporter(repoRoot)] } }
    },
    plugins: [unpluginVue({ isProduction: true }), unpluginVueJsx()]
  }
}

export default defineConfig(config as Parameters<typeof defineConfig>[0])
