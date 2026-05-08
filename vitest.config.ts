import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { NodePackageImporter } from 'sass-embedded'
import { defineConfig } from 'vitest/config'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)))
const vueRuntime = resolve(repoRoot, 'node_modules/vue/dist/vue.runtime.esm-bundler.js')
const vueServerRenderer = resolve(repoRoot, 'node_modules/@vue/server-renderer/index.js')

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: [
      { find: 'vue/server-renderer', replacement: vueServerRenderer },
      { find: 'vue', replacement: vueRuntime }
    ],
    conditions: ['development', 'module', 'import', 'browser', 'default']
  },
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler', importers: [new NodePackageImporter(repoRoot)] }
    }
  },
  test: { globals: true }
})
