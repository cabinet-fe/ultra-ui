import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@ultra-ui/desktop': fileURLToPath(
        new URL('./packages/desktop/src', import.meta.url)
      ),
      '@ultra-ui/utils': fileURLToPath(
        new URL('./packages/utils/src', import.meta.url)
      ),
      '@ultra-ui/compositions': fileURLToPath(
        new URL('./packages/compositions/src', import.meta.url)
      ),
      '@ultra-ui/directives': fileURLToPath(
        new URL('./packages/directives/src', import.meta.url)
      )
    }
  },
  test: {
    globals: true
  }
})
