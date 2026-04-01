import { autoResolveComponent, pluginPresets } from '@builder/vite'
import { existModule } from 'cat-kit/be'
import { dirname, resolve } from 'path'
import UnoCSS from 'unocss/vite'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  return {
    base: '/',

    resolve: {
      extensions: ['.ts', '.js', '.json', '.tsx'],
      alias: [
        { find: /^ultra-ui$/, replacement: resolve(__dirname, '../ui/index.ts') },
        { find: /^ultra-ui\/(.*)$/, replacement: resolve(__dirname, `../ui/$1`) },

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
                const ext = 'ts'
                let moduleId = `${lib}/components/${kebabName}/style.${ext}`

                while (!existModule(moduleId)) {
                  const preKebabName = kebabName
                  kebabName = kebabName.replace(/-[a-z]$/, '')
                  if (preKebabName === kebabName) return
                  moduleId = `${lib}/components/${kebabName}/style.${ext}`
                }

                return moduleId
              }
            })
          ],
          dts: true
          // include: [/\.vue$/]
        }
      }),

      UnoCSS(),

      vueDevTools({ launchEditor: 'cursor' })
    ],

    server: { port: 7788, host: true }
  }
})
