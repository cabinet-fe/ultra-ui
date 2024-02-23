import { kebabCase, readDir } from 'cat-kit/be'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let components = new Set<string>()
const componentsDir = resolve(__dirname, '../ui-packages/components')

readDir(componentsDir, {
  readType: 'dir'
}).then(dirs => {
  components = new Set(dirs.map(dir => dir.name))
})

/**
 * 匹配组件目录，因为有的组件目录下有多个组件
 * @param kebabName 组件的kebab名称
 */
function matchComponentDir(kebabName: string): string | null {
  const parts = kebabName.split('-')

  for (let i = 0; i < parts.length; i++) {
    const componentDir = parts.slice(0, i + 1).join('-')
    if (components.has(componentDir)) {
      return componentDir
    }
  }
  return null
}

interface ComponentInfo {
  as?: string
  name?: string
  from: string
  sideEffects?: string
}

export function UIResolver(componentName: string): ComponentInfo | void {
  // 组件名称示例: UButton
  if (componentName.startsWith('U')) {
    // u-component
    const kebabName = kebabCase(componentName.slice(1))
    const componentDirName = matchComponentDir(kebabName)

    const info: ComponentInfo = {
      name: componentName,
      from: 'ultra-ui'
    }

    const dirExist = componentDirName
      ? existsSync(resolve(componentsDir, componentDirName))
      : false

    if (dirExist) {
      info.sideEffects = `@ui/components/${componentDirName}/style`
    }

    return info
  }
}
