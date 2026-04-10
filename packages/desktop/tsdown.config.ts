import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { NodePackageImporter } from 'sass-embedded'
import { defineConfig } from 'tsdown'
import VueJSX from 'unplugin-vue-jsx/rolldown'
import Vue from 'unplugin-vue/rolldown'

const dir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(dir, '../..')

export default defineConfig({
  entry: ['src/index.ts', 'src/install.ts', 'src/types/index.ts', 'src/components/**/style.ts'],
  format: ['esm'],
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
      '@ultra-ui/utils',
      '@ultra-ui/compositions',
      '@ultra-ui/directives',
      '@ultra-ui/styles',
      '@ultra-ui/icons',
      '@cat-kit/core',
      '@codemirror/lang-java',
      '@codemirror/lang-javascript',
      '@codemirror/lang-json',
      '@codemirror/lang-sql',
      '@codemirror/state',
      '@codemirror/view',
      '@lexical/clipboard',
      '@lexical/history',
      '@lexical/html',
      '@lexical/link',
      '@lexical/list',
      '@lexical/rich-text',
      '@lexical/selection',
      '@lexical/utils',
      'codemirror',
      'lexical'
    ]
  },
  css: {
    inject: true,
    preprocessorOptions: {
      scss: { api: 'modern-compiler', importers: [new NodePackageImporter(repoRoot)] }
    }
  }
})
