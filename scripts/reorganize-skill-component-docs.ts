#!/usr/bin/env bun

import { constants } from 'node:fs'
import { access, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const COMPONENTS_DOC_DIR = join(REPO_ROOT, 'skills/veltra-ui/packages/desktop/components')
const TYPES_SRC_DIR = join(REPO_ROOT, 'packages/desktop/src/types')

const COMPANION_API_SECTIONS: Record<string, string> = {
  'context-menu': `## contextmenu 函数式 API

\`\`\`ts
import { contextmenu } from '@veltra/desktop'

contextmenu.pop({
  mousePosition: { x: event.clientX, y: event.clientY },
  menus: [
    { label: '复制', callback: () => {} },
    { label: '删除', callback: async () => {} }
  ]
})
\`\`\`

- \`contextmenu.pop(options: ContextMenuProps)\` — 在鼠标位置弹出菜单，点击外部或回调完成后自动关闭并销毁 DOM
`,
  notification: `## Notification 函数式 API

\`\`\`ts
import { Notification } from '@veltra/desktop'

Notification({ title: '提示', message: '内容', type: 'success' })
Notification({
  title: '删除确认',
  message: '确定删除？',
  type: 'danger',
  duration: 0,
  closable: true,
  buttonText: '撤销',
  position: 'top-right',
  onClick: () => {},
  onClose: () => {}
})
\`\`\`

\`\`\`ts
Notification(options: NotificationProps): void
\`\`\`
`
}

function shouldRemoveSection(heading: string): boolean {
  if (/专属|关联类型|函数式 API|Options|键盘快捷键|回调/.test(heading)) {
    return false
  }

  if (heading.startsWith('UMessage 组件')) {
    return true
  }

  if (/Props/.test(heading)) {
    return true
  }

  if (/Emits/.test(heading)) {
    return true
  }

  if (/Exposed/.test(heading)) {
    return true
  }

  if (/Slots/.test(heading)) {
    return true
  }

  return false
}

function shouldRemoveSubSection(heading: string): boolean {
  return /Props\s*\(/.test(heading) || heading === 'MessageConfirmProps'
}

function slimApiContent(content: string, _kebab: string): string {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const result: string[] = []
  let skipping = false
  let skipLevel: 2 | 3 = 2

  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/)
    const h3 = line.match(/^### (.+)$/)

    if (h2) {
      skipping = shouldRemoveSection(h2[1]!.trim())
      skipLevel = 2

      if (!skipping) {
        result.push(line)
      }

      continue
    }

    if (h3 && !skipping) {
      if (shouldRemoveSubSection(h3[1]!.trim())) {
        skipping = true
        skipLevel = 3
        continue
      }
    }

    if (h3 && skipping && skipLevel === 3) {
      skipping = false
      skipLevel = 2

      if (shouldRemoveSubSection(h3[1]!.trim())) {
        skipping = true
        skipLevel = 3
        continue
      }

      result.push(line)
      continue
    }

    if (skipping) {
      continue
    }

    result.push(line)
  }

  let slimmed = result.join('\n')

  slimmed = slimmed.replace(/^### MessageConfirmProps[\s\S]*?```\n[\s\S]*?```\n/m, '')
  slimmed = slimmed.replace(
    /> 示例见 \[[^\]]+\]\(\.\/[^)]+\)/g,
    '> 示例见 [examples.md](./examples.md)'
  )

  return slimmed.replace(/\n{3,}/g, '\n\n').trimEnd()
}

async function hasTypeFile(kebab: string): Promise<boolean> {
  try {
    await access(join(TYPES_SRC_DIR, `${kebab}.ts`), constants.F_OK)
    return true
  } catch {
    return false
  }
}

function injectTypeReference(content: string, _kebab: string, _hasTypes: boolean): string {
  // 类型索引由 bun run skill:gen 写入各组件目录的 types.d.ts + api.md 模板
  return content
}

function injectCompanionApi(content: string, kebab: string): string {
  const section = COMPANION_API_SECTIONS[kebab]

  if (!section || content.includes(section.slice(0, 20))) {
    return content
  }

  const firstSection = content.search(/\n## /)

  if (firstSection === -1) {
    return `${content.trimEnd()}\n\n${section}`
  }

  return `${content.slice(0, firstSection).trimEnd()}\n\n${section}${content.slice(firstSection)}`
}

function ensureExamplesLink(content: string): string {
  if (content.includes('[examples.md](./examples.md)')) {
    return content
  }

  return `${content.trimEnd()}\n\n> 示例见 [examples.md](./examples.md)\n`
}

async function transformApi(content: string, kebab: string): Promise<string> {
  const hasTypes = await hasTypeFile(kebab)
  let next = slimApiContent(content, kebab)
  next = injectTypeReference(next, kebab, hasTypes)
  next = injectCompanionApi(next, kebab)
  next = ensureExamplesLink(next)
  return `${next.trimEnd()}\n`
}

async function main(): Promise<void> {
  const entries = await readdir(COMPONENTS_DOC_DIR)
  const mdFiles = entries.filter((name) => name.endsWith('.md') && !name.endsWith('.examples.md'))

  await Promise.all(
    mdFiles.map(async (fileName) => {
      const kebab = basename(fileName, '.md')
      const apiSource = join(COMPONENTS_DOC_DIR, fileName)
      const examplesSource = join(COMPONENTS_DOC_DIR, `${kebab}.examples.md`)
      const targetDir = join(COMPONENTS_DOC_DIR, kebab)

      const apiContent = await readFile(apiSource, 'utf8')
      let examplesContent = ''

      try {
        examplesContent = await readFile(examplesSource, 'utf8')
      } catch {
        examplesContent = `# U${kebab
          .split('-')
          .map((part) => part[0]!.toUpperCase() + part.slice(1))
          .join('')} 示例\n`
      }

      await mkdir(targetDir, { recursive: true })
      await writeFile(join(targetDir, 'api.md'), await transformApi(apiContent, kebab), 'utf8')
      await writeFile(join(targetDir, 'examples.md'), examplesContent, 'utf8')
      await rm(apiSource)
      await rm(examplesSource, { force: true })
    })
  )

  console.log(
    `[reorganize-skill-component-docs] moved ${mdFiles.length} components to {name}/api.md + examples.md`
  )
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[reorganize-skill-component-docs] ${message}`)
  process.exit(1)
})
