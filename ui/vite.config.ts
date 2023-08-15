import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/',

  resolve: {
    extensions: ['.ts', '.js', '.json', '.tsx']
  },

  plugins: [vue(), vueJsx(), dts()],

  css: {
    preprocessorOptions: {
      scss: {}
    }
  },

  build: {
    lib: {
      entry: resolve(__dirname, './index.ts'),
      formats: ['es'],
      name: 'ultra-ui',
      fileName(format, entryName) {
        return `${entryName}.js`
      }
    },

    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['vue', 'cat-kit', 'icon-ultra', 'cat-kit/fe'],
      // preserveEntrySignatures: 'strict',

      output: {
        preserveModules: true,

        // assetFileNames(ctx) {
        //   return ctx.name || ''
        // }
      }
    }
  }
})
