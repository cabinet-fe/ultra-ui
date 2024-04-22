import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js', '.json', '.tsx']
  },

  plugins: [
    vue(),
    vueJsx(),
    dts({
      include: ['../ui-packages/**/*']
    })
  ],

  build: {
    sourcemap: true,

    lib: {
      entry: [resolve(__dirname, 'index.ts'), resolve(__dirname, 'theme.ts')],
      formats: ['es']
    },

    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['vue', 'icon-ultra', 'cat-kit/fe'],

      output: {
        preserveModules: true
      }
    }
  }
})
