#!/usr/bin/env bun
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { REPO_ROOT } from './repo-root.ts'

const SKILL_DIR = join(REPO_ROOT, 'skills/veltra-desktop')
const TYPES_DIR = join(REPO_ROOT, 'packages/desktop/src/types')
const COMPONENTS_DIR = join(REPO_ROOT, 'packages/desktop/src/components')
const GENERATED_DIR = join(SKILL_DIR, 'generated')
const COMPONENTS_DOC_DIR = join(GENERATED_DIR, 'components')
const CATEGORIES_DIR = join(GENERATED_DIR, 'categories')

interface CategoryDef {
  file: string
  key: string
  label: string
  components: string[]
}

const CATEGORIES: Record<string, CategoryDef> = {
  form: {
    key: 'form',
    file: 'form.md',
    label: '表单',
    components: [
      'form',
      'form-item',
      'input',
      'textarea',
      'password-input',
      'number-input',
      'number-range-input',
      'select',
      'multi-select',
      'cascade',
      'multi-tree-select',
      'tree-select',
      'auto-complete',
      'checkbox',
      'checkbox-group',
      'radio',
      'radio-group',
      'switch',
      'slider',
      'date-picker',
      'date-range-picker',
      'date-panel',
      'file-picker',
      'grid-input',
      'group-input'
    ]
  },
  'data-display': {
    key: 'data-display',
    file: 'data-display.md',
    label: '数据展示',
    components: [
      'table',
      'tree',
      'list',
      'grid',
      'paginator',
      'tag',
      'badge',
      'text',
      'number',
      'calendar',
      'gantt-chart',
      'progress-nodes'
    ]
  },
  feedback: {
    key: 'feedback',
    file: 'feedback.md',
    label: '反馈通知',
    components: [
      'message',
      'notification',
      'dialog',
      'drawer',
      'pop-confirm',
      'message-confirm',
      'loading',
      'progress',
      'tip',
      'empty'
    ]
  },
  navigation: {
    key: 'navigation',
    file: 'navigation.md',
    label: '导航',
    components: ['menu', 'breadcrumb', 'tabs', 'steps', 'dropdown', 'float-button', 'context-menu']
  },
  layout: {
    key: 'layout',
    file: 'layout.md',
    label: '布局容器',
    components: ['layout', 'card', 'scroll', 'watermark']
  },
  editor: {
    key: 'editor',
    file: 'editor.md',
    label: '编辑器',
    components: [
      'code-editor',
      'rich-text-editor',
      'expression-editor',
      'condition-editor',
      'table-editor',
      'batch-edit'
    ]
  },
  general: {
    key: 'general',
    file: 'general.md',
    label: '通用',
    components: ['button', 'icon', 'action', 'check-tag', 'theme', 'palette', 'node-render']
  }
}

const SHARED_TYPE_FILES = [
  'animation.ts',
  'css-transition.ts',
  'pop.ts',
  'quick-batch-edit.ts',
  'multi-auto-complete.ts',
  'text-editor.ts'
]

function kebabToPascal(name: string): string {
  return name
    .split('-')
    .map((s) => s[0]!.toUpperCase() + s.slice(1))
    .join('')
}

async function tryReadFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8')
  } catch {
    return null
  }
}

async function getExportNames(componentName: string): Promise<string[]> {
  const content = await tryReadFile(join(COMPONENTS_DIR, componentName, 'index.ts'))
  if (!content) return [`U${kebabToPascal(componentName)}`]

  const names: string[] = []

  for (const m of content.matchAll(/export\s*\{[^}]*\bdefault\s+as\s+(\w+)[^}]*\}/g)) {
    names.push(m[1]!)
  }

  for (const m of content.matchAll(/export\s*\{\s*(\w+)\s*\}/g)) {
    if (!names.includes(m[1]!)) {
      names.push(m[1]!)
    }
  }

  return names.length > 0 ? names : [`U${kebabToPascal(componentName)}`]
}

function extractDescription(content: string, name: string): string {
  const pascal = kebabToPascal(name)
  const interfaceRe = new RegExp(`export\\s+interface\\s+${pascal}Props`)
  const interfaceMatch = interfaceRe.exec(content)
  if (interfaceMatch == null) return ''

  const before = content.slice(0, interfaceMatch.index).trimEnd()
  if (!before.endsWith('*/')) return ''

  const jsdocStart = before.lastIndexOf('/**')
  if (jsdocStart === -1) return ''

  const jsdocBody = before.slice(jsdocStart + 3, -2)
  const lines = jsdocBody
    .split('\n')
    .map((l) => l.replace(/^\s*\*?\s*/, '').trim())
    .filter(Boolean)
  return lines[0] ?? ''
}

async function writeComponentDoc(comp: string): Promise<void> {
  const exportNames = await getExportNames(comp)
  const exportStr = exportNames.join(', ')
  const typeContent = await tryReadFile(join(TYPES_DIR, `${comp}.ts`))

  const parts: string[] = [`# ${comp} (${exportStr})\n`]
  if (typeContent) {
    parts.push('## 类型\n')
    parts.push('```typescript\n')
    parts.push(typeContent.trimEnd())
    parts.push('\n```\n')
  } else {
    parts.push('（无对应 `types/*.ts` 片段）\n')
  }

  await writeFile(join(COMPONENTS_DOC_DIR, `${comp}.md`), parts.join('\n'), 'utf-8')
}

async function writeCategoryIndex(cat: CategoryDef): Promise<void> {
  const lines: string[] = [
    `# ${cat.label}\n`,
    '',
    '各组件类型定义见 [`../components/`](../components/)：',
    ''
  ]
  for (const comp of cat.components) {
    lines.push(`- [${comp}](../components/${comp}.md)`)
  }
  lines.push('')
  await writeFile(join(CATEGORIES_DIR, cat.file), lines.join('\n'), 'utf-8')
}

async function generateSharedTypes(): Promise<string> {
  const blocks: string[] = []

  for (const file of SHARED_TYPE_FILES) {
    const content = await tryReadFile(join(TYPES_DIR, file))
    if (!content) continue

    blocks.push('```typescript\n' + content.trimEnd() + '\n```')
  }

  return `# 共享类型\n\n${blocks.join('\n\n---\n\n')}\n`
}

async function generateCatalog(): Promise<string> {
  const lines: string[] = [
    '# 组件目录\n',
    '',
    '| 组件 | 分类 | 导出名 | 描述 | 类型文档 |',
    '|------|------|--------|------|----------|'
  ]

  for (const cat of Object.values(CATEGORIES)) {
    for (const comp of cat.components) {
      const exportNames = await getExportNames(comp)
      const typeContent = await tryReadFile(join(TYPES_DIR, `${comp}.ts`))
      const desc = typeContent ? extractDescription(typeContent, comp) : ''
      lines.push(
        `| ${comp} | ${cat.label} | ${exportNames.join(', ')} | ${desc} | [components/${comp}.md](components/${comp}.md) |`
      )
    }
  }

  return lines.join('\n') + '\n'
}

interface Manifest {
  syncedAt: string
  totalComponents: number
  categories: Record<string, { label: string; components: string[] }>
  sharedTypes: string[]
  componentDocs: string[]
}

async function main(): Promise<void> {
  console.log('[sync] syncing veltra-desktop docs...')

  if (!existsSync(TYPES_DIR)) {
    console.error(`[sync] types dir not found: ${TYPES_DIR}`)
    process.exit(1)
  }

  await rm(GENERATED_DIR, { recursive: true, force: true })
  await mkdir(COMPONENTS_DOC_DIR, { recursive: true })
  await mkdir(CATEGORIES_DIR, { recursive: true })

  let totalComponents = 0
  const categoryManifest: Manifest['categories'] = {}
  const componentDocs: string[] = []

  for (const cat of Object.values(CATEGORIES)) {
    console.log(`  ${cat.label} (${cat.components.length})`)
    for (const comp of cat.components) {
      await writeComponentDoc(comp)
      componentDocs.push(`components/${comp}.md`)
    }
    await writeCategoryIndex(cat)
    totalComponents += cat.components.length
    categoryManifest[cat.key] = { label: cat.label, components: cat.components }
  }

  console.log(`  共享类型 (${SHARED_TYPE_FILES.length})`)
  await writeFile(join(GENERATED_DIR, 'shared-types.md'), await generateSharedTypes(), 'utf-8')

  console.log('  组件目录')
  await writeFile(join(GENERATED_DIR, 'catalog.md'), await generateCatalog(), 'utf-8')

  const manifest: Manifest = {
    syncedAt: new Date().toISOString(),
    totalComponents,
    categories: categoryManifest,
    sharedTypes: SHARED_TYPE_FILES.map((f) => f.replace('.ts', '')),
    componentDocs: componentDocs.sort((a, b) => a.localeCompare(b))
  }
  await writeFile(
    join(GENERATED_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8'
  )

  console.log(`[sync] done: ${totalComponents} components → generated/`)
}

main().catch((e: unknown) => {
  console.error('[sync] failed:', e)
  process.exit(1)
})
