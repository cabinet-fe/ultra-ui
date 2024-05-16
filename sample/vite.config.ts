import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueJSX from '@vitejs/plugin-vue-jsx'
import Components from 'unplugin-vue-components/vite'
import autoprefixer from 'autoprefixer'
import { UltraUIResolver } from 'vite-helper/resolver'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig(() => {
  return {
    base: '/',

    resolve: {
      extensions: ['.ts', '.js', '.json', '.tsx'],
      alias: [
        {
          find: /^ultra-ui$/,
          replacement: resolve(__dirname, '../ui/index.ts')
        },
        {
          find: /^ultra-ui\/(.*)$/,
          replacement: resolve(__dirname, `../ui/$1`)
        },

        { find: /^@ui\/(.*)$/, replacement: resolve(__dirname, `../ui/$1`) }
      ]
    },

    plugins: [
      Vue(),
      VueJSX(),
      Components({
        resolvers: [UltraUIResolver],
        dts: true,
        include: [/\.vue$/]
      })
    ],

    css: {
      postcss: {
        plugins: [
          autoprefixer({
            overrideBrowserslist: [
              'ie >= 11',
              'chrome >= 50',
              'firefox >= 40',
              'safari >= 10',
              'edge >= 13',
              'ios >= 10',
              'android >= 5'
            ]
          }) as any
        ]
      }
    },

    server: {
      port: 7788,
      host: true
    }
  }
})
