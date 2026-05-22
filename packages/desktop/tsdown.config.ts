import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { NodePackageImporter } from 'sass-embedded'
import { defineConfig } from 'tsdown'
import VueJSX from 'unplugin-vue-jsx/rolldown'
import Vue from 'unplugin-vue/rolldown'

const dir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(dir, '../..')

export default defineConfig({
  entry: ['src/index.ts', 'src/install.ts', 'src/style.ts', 'src/components/**/style.ts'],
  format: ['esm'],
  /** 组件 style.ts 多为「仅副作用、无导出」链；默认摇树会裁掉对其它 style 的 import，导致 dist 丢失依赖 CSS。 */
  treeshake: {
    moduleSideEffects: [{ test: /\/components\/[^/]+\/style\.ts$/, sideEffects: true }]
  },
  unbundle: true,
  dts: { vue: true },
  platform: 'browser',
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  plugins: [Vue({ isProduction: true }), VueJSX()],
  deps: {
    neverBundle: [
      'vue',
      '@veltra/utils',
      '@veltra/compositions',
      '@veltra/directives',
      '@veltra/styles',
      '@veltra/icons',
      '@cat-kit/core',
      '@codemirror/lang-java',
      '@codemirror/lang-javascript',
      '@codemirror/lang-json',
      '@codemirror/lang-sql',
      '@codemirror/state',
      '@codemirror/view',
      '@embedpdf/core',
      '@embedpdf/engines',
      '@embedpdf/plugin-document-manager',
      '@embedpdf/plugin-render',
      '@embedpdf/plugin-scroll',
      '@embedpdf/plugin-viewport',
      '@embedpdf/plugin-zoom',
      '@cat-kit/excel',
      '@lexical/clipboard',
      '@lexical/history',
      '@lexical/html',
      '@lexical/link',
      '@lexical/list',
      '@lexical/rich-text',
      '@lexical/selection',
      '@lexical/utils',
      '@visactor/vtable',
      'codemirror',
      'docx-preview',
      'lexical'
    ]
  },
  css: {
    inject: true,
    preprocessorOptions: { scss: { importers: [new NodePackageImporter(repoRoot)] } }
  }
})
