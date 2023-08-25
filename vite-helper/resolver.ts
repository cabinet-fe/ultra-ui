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

export function UIResolver(componentName: string) {
  if (componentName.startsWith('U')) {
    const kebName = kebabCase(componentName.slice(1))
    const dirExist = existsSync(resolve(componentsDir, kebName))
    const kebNamePrefix = kebName.split('-')[0]!
    const componentDir = dirExist
      ? kebName
      : components.has(kebNamePrefix)
      ? kebNamePrefix
      : ''
    return {
      name: componentName,
      from: 'ultra-ui',
      sideEffects: componentDir
        ? `@ui/components/${componentDir}/style`
        : undefined
    }
  }
}
