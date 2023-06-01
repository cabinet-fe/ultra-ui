import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  base: '/',

  resolve: {
    extensions: ['.ts', '.js', '.json', '.tsx']
  },

  plugins: [vue(), vueJsx()],

  server: {
    port: 7788,
    host: true
  }
})
