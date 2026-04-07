import { autoResolveComponent, pluginPresets } from '@builder/vite'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import UnoCSS from 'unocss/vite'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

const __dirname = dirname(fileURLToPath(import.meta.url))
const desktopRoot = resolve(__dirname, '../../packages/desktop/src')
const utilsRoot = resolve(__dirname, '../../packages/utils/src')

function existModule(moduleId: string): boolean {
  if (!moduleId.startsWith('@ultra-ui/desktop/')) return false
  const rel = moduleId.slice('@ultra-ui/desktop/'.length)
  return existsSync(resolve(desktopRoot, rel))
}

export default defineConfig(() => {
  return {
    base: '/',

    resolve: {
      extensions: ['.ts', '.js', '.json', '.tsx'],
      alias: [
        {
          find: /^@ultra-ui\/desktop(\/.*)?$/,
          replacement: `${desktopRoot}$1`
        },
        {
          find: /^@ultra-ui\/utils(\/.*)?$/,
          replacement: `${utilsRoot}$1`
        },
        {
          find: /^@ultra-ui\/compositions$/,
          replacement: resolve(__dirname, '../../packages/compositions/src/index.ts')
        },
        {
          find: /^@ultra-ui\/directives(\/.*)?$/,
          replacement: resolve(__dirname, '../../packages/directives/src$1')
        },
        { find: /^ultra-ui$/, replacement: resolve(desktopRoot, 'index.ts') },
        {
          find: /^ultra-ui\/(.*)$/,
          replacement: `${desktopRoot}/$1`
        }
      ]
    },

    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [resolve(__dirname, '../../packages')]
        }
      }
    },

    plugins: [
      pluginPresets(['unplugin-components', 'vue', 'vue-jsx'], {
        'unplugin-components': {
          resolvers: [
            autoResolveComponent({
              prefix: 'U',
              lib: '@ultra-ui/desktop',
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
        }
      }),

      UnoCSS(),

      vueDevTools({ launchEditor: 'cursor' })
    ],

    server: { port: 7788, host: true }
  }
})
