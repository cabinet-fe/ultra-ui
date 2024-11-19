import fg from 'fast-glob'
import { UI_ROOT } from './helper'
import { resolve } from 'node:path'

export async function genInstall() {
  const entries = await fg.glob(
    ['components/**/style.ts', 'directives/**/style.ts'],
    {
      ignore: ['**/node_modules', '**/disabled.*/**', '**/_*.scss'],
      cwd: UI_ROOT
    }
  )

  const stylesImports = entries
    .map(entry => `import './${entry.replace(/\.ts$/, '')}'`)
    .join('\n')

  const installScripts = `
import type { App } from 'vue'
import * as components from './components'
import * as directives from './directives'

// 引入样式
import './styles'
${stylesImports}

export function UltraUI(app: App) {
  Object.keys(components).forEach(key => {
    if (key.startsWith('U')) {
      const component = components[key]
      component && app.component(key, component)
    }
  })

  Object.keys(directives).forEach(key => {
    if (key.startsWith('v')) {
      const directive = directives[key]
      directive && app.directive(key.slice(1), directive)
    }
  })
}
`

  await Bun.write(resolve(UI_ROOT, 'install.ts'), installScripts)
}
