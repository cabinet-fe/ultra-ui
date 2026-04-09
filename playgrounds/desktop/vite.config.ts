import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { autoResolveComponent, pluginPresets } from '@builder/vite'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const desktopRoot = resolve(__dirname, '../../packages/desktop/src')

function existModule(moduleId: string): boolean {
  if (!moduleId.startsWith('@ultra-ui/desktop/')) return false
  const rel = moduleId.slice('@ultra-ui/desktop/'.length)
  return existsSync(resolve(desktopRoot, rel))
}

export default defineConfig(() => {
  return {
    base: '/',

    resolve: {
      extensions: ['.ts', '.js', '.json', '.tsx']
    },

    css: { preprocessorOptions: { scss: { loadPaths: [resolve(__dirname, '../../packages')] } } },

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
      })
    ],

    server: { port: 7788, host: true }
  }
})
