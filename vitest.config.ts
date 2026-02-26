import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@ui': fileURLToPath(new URL('./ui', import.meta.url))
    }
  },
  test: {
    globals: true
  }
})