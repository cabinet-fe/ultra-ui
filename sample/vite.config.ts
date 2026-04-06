import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ComponentResolver } from 'unplugin-vue-components/types'
import Components from 'unplugin-vue-components/vite'
import UnoCSS from 'unocss/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

const __dirname = dirname(fileURLToPath(import.meta.url))

function existModule(moduleId: string): boolean {
  const m = moduleId.match(/^@ultra-ui\/pc\/src\/(.+)\.ts$/)
  if (!m) return false
  const full = resolve(__dirname, '../packages/pc', m[1] + '.ts')
  return existsSync(full)
}

function pascalToKebab(name: string): string {
  return name
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function resolveStyleSideEffects(kebab: string): string | undefined {
  const ext = 'ts'
  let kebabName = kebab
  let moduleId = `@ultra-ui/pc/src/components/${kebabName}/style.${ext}`

  while (!existModule(moduleId)) {
    const preKebabName = kebabName
    kebabName = kebabName.replace(/-[a-z]$/, '')
    if (preKebabName === kebabName) return undefined
    moduleId = `@ultra-ui/pc/src/components/${kebabName}/style.${ext}`
  }

  return moduleId
}

function ultraUIResolver(): ComponentResolver {
  return {
    type: 'component',
    resolve: name => {
      if (!name.startsWith('U') || name.length < 2) return
      const rest = name.slice(1)
      if (!rest) return
      const kebab = pascalToKebab(rest)
      const sideEffects = resolveStyleSideEffects(kebab)
      return {
        name,
        from: '@ultra-ui/pc',
        sideEffects
      }
    }
  }
}

export default defineConfig(() => {
  return {
    base: '/',

    resolve: {
      extensions: ['.ts', '.js', '.json', '.tsx'],
      alias: [
        {
          find: /^@ultra-ui\/core$/,
          replacement: resolve(__dirname, '../packages/core/src/index.ts')
        },
        {
          find: /^@ultra-ui\/core\/(.*)$/,
          replacement: resolve(__dirname, '../packages/core/src/$1')
        },
        {
          find: /^@ultra-ui\/styles$/,
          replacement: resolve(__dirname, '../packages/styles/src/index.ts')
        },
        {
          find: /^@ultra-ui\/styles\/(.*)$/,
          replacement: resolve(__dirname, '../packages/styles/src/$1')
        },
        {
          find: /^@ultra-ui\/directives$/,
          replacement: resolve(__dirname, '../packages/directives/src/index.ts')
        },
        {
          find: /^@ultra-ui\/directives\/(.*)$/,
          replacement: resolve(__dirname, '../packages/directives/src/$1')
        },
        {
          find: /^@ultra-ui\/pc$/,
          replacement: resolve(__dirname, '../packages/pc/src/index.ts')
        },
        {
          find: /^@ultra-ui\/pc\/(.*)$/,
          replacement: resolve(__dirname, '../packages/pc/src/$1')
        }
      ]
    },

    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [resolve(__dirname, '../packages/styles/src')]
        }
      }
    },

    plugins: [
      vue(),
      vueJsx(),
      Components({
        resolvers: [ultraUIResolver()],
        dts: true
      }),
      UnoCSS(),
      vueDevTools({ launchEditor: 'cursor' })
    ],

    server: { port: 7788, host: true }
  }
})
