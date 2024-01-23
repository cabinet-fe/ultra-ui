import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueJSX from '@vitejs/plugin-vue-jsx'
import Components from 'unplugin-vue-components/vite'
import autoprefixer from 'autoprefixer'
import { UIResolver } from 'vite-helper/resolver'

export default defineConfig(() => {
  return {
    base: '/',

    resolve: {
      extensions: ['.ts', '.js', '.json', '.tsx']
    },

    plugins: [
      Vue({
        script: {
          defineModel: true
        }
      }),
      VueJSX(),
      Components({
        resolvers: [UIResolver],
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
