import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@ultra-ui/core': fileURLToPath(
        new URL('./packages/core/src', import.meta.url)
      ),
      '@ultra-ui/styles': fileURLToPath(
        new URL('./packages/styles/src', import.meta.url)
      ),
      '@ultra-ui/directives': fileURLToPath(
        new URL('./packages/directives/src', import.meta.url)
      ),
      '@ultra-ui/pc': fileURLToPath(
        new URL('./packages/pc/src', import.meta.url)
      ),
      '@ultra-ui/pc/types': fileURLToPath(
        new URL('./packages/pc/src/types', import.meta.url)
      )
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [resolve(root, 'packages/styles/src')]
      }
    }
  },
  test: {
    globals: true,
    include: ['packages/pc/src/components/**/__test__/**/*.test.ts']
  }
})
