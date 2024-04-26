import { kebabCase, readDir } from 'cat-kit/be'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

interface ComponentInfo {
  as?: string
  name?: string
  from: string
  sideEffects?: string
}

/**
 * 获取所有的组件的目录名
 * @param componentsDir 组件目录
 * @returns
 */
async function getComponentsDirname(componentsDir: string) {
  const dirs = await readDir(componentsDir, {
    readType: 'dir'
  })

  return new Set(dirs.map(dir => dir.name))
}

/**
 * 获取组件所在目录，因为有的组件目录下有多个组件
 * @param kebabName 组件的kebab名称
 */
function getComponentDir(
  kebabName: string,
  dirs: Set<string> = new Set()
): string | null {
  const parts = kebabName.split('-')
  if (dirs.has(kebabName)) return kebabName
  for (let i = 0; i < parts.length; i++) {
    const componentDir = parts.slice(0, i + 1).join('-')
    if (dirs.has(componentDir)) {
      return componentDir
    }
  }
  return null
}

export interface ResolverOptions {
  /**
   * 组件目录，必须是一个绝对路径
   */
  componentsDir: string

  /** 前缀 */
  prefix: string

  /**
   * 库名称
   * @example import {} from 'lib'
   */
  lib: string

  /** 附加的引入 */
  sideEffects?: (name: string) => string
}

/**
 * 定义组件的解析器
 */
export function defineResolver(options: ResolverOptions) {
  const { componentsDir, prefix, lib, sideEffects } = options
  let dirs: undefined | Set<string>
  getComponentsDirname(componentsDir).then(_dirs => {
    dirs = _dirs
  })
  const resolver = (componentName: string) => {
    if (componentName.startsWith(prefix)) {
      // ${prefix}-component
      const kebabName = kebabCase(componentName.slice(prefix.length))
      const componentDirName = getComponentDir(kebabName, dirs)
      const info: ComponentInfo = {
        name: componentName,
        from: lib
      }

      const dirExist = componentDirName
        ? existsSync(resolve(componentsDir, componentDirName))
        : false

      if (dirExist && sideEffects) {
        info.sideEffects = sideEffects(componentDirName!)
      }
      return info
    }
  }

  return resolver
}

const __dirname = dirname(fileURLToPath(import.meta.url))
export const UltraUIResolver = defineResolver({
  componentsDir: resolve(__dirname, '../ui/components'),
  prefix: 'U',
  lib: 'ultra-ui',
  sideEffects(name) {
    return `ultra-ui/components/${name}/style`
  }
})