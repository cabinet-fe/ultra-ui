import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { NodePackageImporter } from 'sass-embedded'
import { defineConfig } from 'vitest/config'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)))

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: { conditions: ['development', 'module', 'import', 'types', 'browser', 'default'] },
  css: {
    preprocessorOptions: {
      scss: { api: 'modern-compiler', importers: [new NodePackageImporter(repoRoot)] }
    }
  },
  test: { globals: true }
})
