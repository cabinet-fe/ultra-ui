import { kebabCase } from 'cat-kit/be'
import { componentDirs } from './component-dirs'

interface ComponentInfo {
  as?: string
  name?: string
  from: string
  sideEffects?: string
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
   * 组件目录名称，用于定位每个子组件所属的父组件目录
   */
  componentDirs: string[]

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
  const { componentDirs, prefix, lib, sideEffects } = options
  const componentDirsSet = new Set(componentDirs)
  const resolver = (componentName: string) => {
    if (componentName.startsWith(prefix)) {
      // ${prefix}-component
      const kebabName = kebabCase(componentName.slice(prefix.length))
      const componentDirName = getComponentDir(kebabName, componentDirsSet)
      const info: ComponentInfo = {
        name: componentName,
        from: lib
      }

      if (componentDirName && sideEffects) {
        info.sideEffects = sideEffects(componentDirName!)
      }
      return info
    }
  }

  return resolver
}

export const UltraUIResolver = defineResolver({
  componentDirs,
  prefix: 'U',
  lib: 'ultra-ui',
  sideEffects(name) {
    return `ultra-ui/components/${name}/style`
  }
})
