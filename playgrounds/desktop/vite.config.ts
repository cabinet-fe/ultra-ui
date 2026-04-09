import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import type { ComponentResolver } from 'unplugin-vue-components/types'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const desktopRoot = resolve(__dirname, '../../packages/desktop/src')

function existModule(moduleId: string): boolean {
  if (!moduleId.startsWith('@ultra-ui/desktop/')) return false
  const rel = moduleId.slice('@ultra-ui/desktop/'.length)
  return existsSync(resolve(desktopRoot, rel))
}

function pascalWithoutUPrefixToKebab(name: string): string {
  return name
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .slice(1)
}

function resolveStyleSideEffects(kebabName: string): string | undefined {
  const ext = 'ts'
  let moduleId = `@ultra-ui/desktop/components/${kebabName}/style.${ext}`

  while (!existModule(moduleId)) {
    const preKebabName = kebabName
    kebabName = kebabName.replace(/-[a-z]$/, '')
    if (preKebabName === kebabName) return
    moduleId = `@ultra-ui/desktop/components/${kebabName}/style.${ext}`
  }

  return moduleId
}

function ultraUiDesktopResolver(): ComponentResolver {
  return {
    type: 'component',
    resolve: (name: string) => {
      if (!name.startsWith('U') || name.length < 2) return
      const kebab = pascalWithoutUPrefixToKebab(name.slice(1))
      if (!kebab) return

      return { name, from: '@ultra-ui/desktop', sideEffects: resolveStyleSideEffects(kebab) }
    }
  }
}

export default defineConfig(() => {
  return {
    base: '/',

    resolve: { extensions: ['.ts', '.js', '.json', '.tsx'] },

    plugins: [vue(), vueJsx(), Components({ resolvers: [ultraUiDesktopResolver()], dts: true })],

    server: { port: 7788, host: true }
  }
})
