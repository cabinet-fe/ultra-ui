import { defineConfig } from 'vite'
import { autoResolveComponent, pluginPresets } from '@builder/vite'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import vueDevTools from 'vite-plugin-vue-devtools'
import UnoCSS from 'unocss/vite'
import { createRequire } from 'node:module'
import { existModule } from 'cat-kit/be'
const __dirname = dirname(fileURLToPath(import.meta.url))

const r = createRequire(import.meta.url)

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
      pluginPresets(['unplugin-components', 'vue', 'vue-jsx'], {
        'unplugin-components': {
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
        }
      }),

      UnoCSS(),

      vueDevTools({
        launchEditor: 'cursor'
      })
    ],

    server: { port: 7788, host: true }
  }
})
