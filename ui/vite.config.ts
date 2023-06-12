import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig({
  base: '/',

  resolve: {
    extensions: ['.ts', '.js', '.json', '.tsx']
  },

  plugins: [vue(), vueJsx()],

  css: {
    preprocessorOptions: {
      scss: {}
    }
  },

  build: {
    lib: {
      entry: [
        resolve(fileURLToPath(new URL('./index.ts', import.meta.url))),
        resolve(fileURLToPath(new URL('./theme.ts', import.meta.url)))
      ],
      name: 'ultra-ui',
      fileName(format, entryName) {
        return `${entryName}.js`
      },
      formats: ['es']
    },

    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['vue'],
      preserveEntrySignatures: 'strict',

      output: {
        preserveModules: true,

        assetFileNames(ctx) {
          return ctx.name || ''
        }
      }
    }
  }
})
