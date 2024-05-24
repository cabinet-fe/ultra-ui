import { kebabCase } from 'cat-kit/be'
import { componentDirs } from './component-dirs.js'

function getComponentDir(kebabName, dirs = /* @__PURE__ */ new Set()) {
  if (kebabName.endsWith('async')) return null
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
function defineResolver(options) {
  const { componentDirs: componentDirs2, prefix, lib, sideEffects } = options
  const componentDirsSet = new Set(componentDirs2)
  const resolver = componentName => {
    if (componentName.startsWith(prefix)) {
      const kebabName = kebabCase(componentName.slice(prefix.length))
      const componentDirName = getComponentDir(kebabName, componentDirsSet)
      const info = {
        name: componentName,
        from: lib
      }
      if (componentDirName && sideEffects) {
        info.sideEffects = sideEffects(componentDirName)
      }
      return info
    }
  }
  return resolver
}
const UltraUIResolver = defineResolver({
  componentDirs,
  prefix: 'U',
  lib: 'ultra-ui',
  sideEffects(name) {
    return `ultra-ui/components/${name}/style`
  }
})

export { UltraUIResolver, defineResolver }
