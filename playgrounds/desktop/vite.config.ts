import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { autoResolveComponent, pluginPresets } from '@builder/vite'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const desktopRoot = resolve(__dirname, '../../packages/desktop/src')
const utilsRoot = resolve(__dirname, '../../packages/utils/src')
const iconsRoot = resolve(__dirname, '../../packages/icons/src')
const iconsVueRoot = resolve(iconsRoot, 'vue')

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
      // CodeMirror 在 node_modules 内存在多份 @codemirror/*，会触发
      // "Unrecognized extension value... multiple instances of @codemirror/state"
      dedupe: [
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/language',
        '@codemirror/commands',
        '@codemirror/search',
        '@codemirror/autocomplete',
        '@codemirror/lint',
        '@lezer/common',
        '@lezer/highlight',
        '@lezer/lr',
        'codemirror'
      ],
      alias: [
        { find: /^@ultra-ui\/desktop(\/.*)?$/, replacement: `${desktopRoot}$1` },
        { find: /^@ultra-ui\/utils(\/.*)?$/, replacement: `${utilsRoot}$1` },
        {
          find: /^@ultra-ui\/compositions$/,
          replacement: resolve(__dirname, '../../packages/compositions/src/index.ts')
        },
        {
          find: /^@ultra-ui\/directives(\/.*)?$/,
          replacement: resolve(__dirname, '../../packages/directives/src$1')
        },
        {
          find: /^@ultra-ui\/icons\/vue\/(.+)$/,
          replacement: `${iconsVueRoot}/$1.vue`
        },
        { find: /^@ultra-ui\/icons\/normal$/, replacement: resolve(iconsRoot, 'normal.ts') },
        { find: /^@ultra-ui\/icons\/colorful$/, replacement: resolve(iconsRoot, 'colorful.ts') },
        { find: /^@ultra-ui\/icons$/, replacement: resolve(iconsRoot, 'index.ts') },
        { find: /^ultra-ui$/, replacement: resolve(desktopRoot, 'index.ts') },
        { find: /^ultra-ui\/(.*)$/, replacement: `${desktopRoot}/$1` }
      ]
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

    server: { port: 7788, host: true },

    optimizeDeps: {
      include: [
        'codemirror',
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/lang-javascript',
        '@codemirror/lang-sql',
        '@codemirror/lang-java',
        '@codemirror/lang-json'
      ]
    }
  }
})
