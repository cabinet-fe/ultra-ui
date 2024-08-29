import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueJSX from '@vitejs/plugin-vue-jsx'
import Components from 'unplugin-vue-components/vite'
import autoprefixer from 'autoprefixer'
import { autoResolveComponent } from 'vite-helper'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { existModule } from 'cat-kit/be'

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
        resolvers: [
          autoResolveComponent({
            prefix: 'U',
            lib: 'ultra-ui',
            sideEffects(kebabName, lib) {
              let moduleId = `${lib}/components/${kebabName}/style.ts`

              while (!existModule(moduleId)) {
                const preKebabName = kebabName
                kebabName = kebabName.replace(/-[a-z]$/, '')
                if (preKebabName === kebabName) return
                moduleId = `${lib}/components/${kebabName}/style.ts`
              }

              return moduleId
            }
          })
        ],
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
      host: true,
      hmr: true
    }
  }
})
