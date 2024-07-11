import { build as viteBuild } from 'vite'
import { getEntries, UI_ROOT, __dirname } from './helper'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export async function build() {
  const entries = await getEntries()

  await viteBuild({
    resolve: {
      alias: [{ find: '@ui', replacement: UI_ROOT }]
    },

    plugins: [
      vue({
        isProduction: true
      }),
      vueJsx()
    ],

    logLevel: 'warn',

    build: {
      sourcemap: true,

      outDir: resolve(__dirname, '../dist'),

      emptyOutDir: true,

      lib: {
        entry: entries,
        formats: ['es']
      },

      rollupOptions: {
        // 确保外部化处理那些你不想打包进库的依赖
        external: ['vue', 'icon-ultra', 'cat-kit/fe'],
        output: {
          chunkFileNames: 'venders/[name]-[hash].js'
        }
      }
    }
  })
}
