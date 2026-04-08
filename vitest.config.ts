import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    conditions: ['development', 'module', 'import', 'types', 'browser', 'default']
  },
  test: {
    globals: true
  }
})
