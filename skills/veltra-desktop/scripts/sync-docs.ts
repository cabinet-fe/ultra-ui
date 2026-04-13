#!/usr/bin/env bun
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SKILL_DIR = join(__dirname, '..')
const ROOT = join(__dirname, '../../..')
const TYPES_DIR = join(ROOT, 'packages/desktop/src/types')
const COMPONENTS_DIR = join(ROOT, 'packages/desktop/src/components')
const PLAYGROUND_DIR = join(ROOT, 'playgrounds/desktop/src')
const GENERATED_DIR = join(SKILL_DIR, 'generated')

interface CategoryDef {
  file: string
  label: string
  components: string[]
}

const CATEGORIES: Record<string, CategoryDef> = {
  form: {
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
    file: 'navigation.md',
    label: '导航',
    components: ['menu', 'breadcrumb', 'tabs', 'steps', 'dropdown', 'float-button', 'context-menu']
  },
  layout: {
    file: 'layout.md',
    label: '布局容器',
    components: ['layout', 'card', 'scroll', 'watermark']
  },
  editor: {
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

const PLAYGROUND_ALIASES: Record<string, string> = {
  'context-menu': 'contextmenu',
  'rich-text-editor': 'text-editor'
}

function kebabToPascal(name: string): string {
  return name
    .split('-')
    .map((s) => s[0].toUpperCase() + s.slice(1))
    .join('')
}

async function tryReadFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8')
  } catch {
    return null
  }
}

async function tryReadDir(path: string): Promise<string[]> {
  try {
    return await readdir(path)
  } catch {
    return []
  }
}

async function getExportNames(componentName: string): Promise<string[]> {
  const content = await tryReadFile(join(COMPONENTS_DIR, componentName, 'index.ts'))
  if (!content) return [`U${kebabToPascal(componentName)}`]

  const names: string[] = []

  for (const m of content.matchAll(/export\s*\{[^}]*\bdefault\s+as\s+(\w+)[^}]*\}/g)) {
    names.push(m[1])
  }

  for (const m of content.matchAll(/export\s*\{\s*(\w+)\s*\}/g)) {
    if (!names.includes(m[1])) {
      names.push(m[1])
    }
  }

  return names.length > 0 ? names : [`U${kebabToPascal(componentName)}`]
}

async function getPlaygroundExamples(
  componentName: string
): Promise<{ file: string; dir: string; content: string }[]> {
  const dirName = PLAYGROUND_ALIASES[componentName] ?? componentName
  const dir = join(PLAYGROUND_DIR, dirName)
  const files = await tryReadDir(dir)
  const vueFiles = files.filter((f) => f.endsWith('.vue')).sort()

  const results: { file: string; dir: string; content: string }[] = []
  for (const file of vueFiles) {
    const content = await readFile(join(dir, file), 'utf-8')
    results.push({ file, dir: dirName, content: content.trimEnd() })
  }
  return results
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

async function generateCategoryFile(category: CategoryDef): Promise<string> {
  const sections: string[] = [`# ${category.label}\n`]

  for (const comp of category.components) {
    const exportNames = await getExportNames(comp)
    const exportStr = exportNames.join(', ')

    sections.push(`## ${comp} (${exportStr})\n`)

    const typeContent = await tryReadFile(join(TYPES_DIR, `${comp}.ts`))
    if (typeContent) {
      sections.push('### 类型定义\n')
      sections.push(
        `\`\`\`typescript\n// 来源: packages/desktop/src/types/${comp}.ts\n${typeContent.trimEnd()}\n\`\`\`\n`
      )
    }

    const examples = await getPlaygroundExamples(comp)
    sections.push('### 使用示例\n')
    if (examples.length > 0) {
      for (const ex of examples) {
        sections.push(
          `\`\`\`vue\n<!-- 来源: playgrounds/desktop/src/${ex.dir}/${ex.file} -->\n${ex.content}\n\`\`\`\n`
        )
      }
    } else {
      sections.push('暂无示例\n')
    }
  }

  return sections.join('\n')
}

async function generateSharedTypes(): Promise<string> {
  const sections: string[] = ['# 共享类型\n']

  for (const file of SHARED_TYPE_FILES) {
    const name = file.replace('.ts', '')
    const content = await tryReadFile(join(TYPES_DIR, file))
    if (!content) continue

    sections.push(`## ${name}\n`)
    sections.push(
      `\`\`\`typescript\n// 来源: packages/desktop/src/types/${file}\n${content.trimEnd()}\n\`\`\`\n`
    )
  }

  return sections.join('\n')
}

async function generateCatalog(): Promise<string> {
  const lines: string[] = [
    '# 组件目录\n',
    '| 组件 | 分类 | 导出名 | 描述 |',
    '|------|------|--------|------|'
  ]

  for (const cat of Object.values(CATEGORIES)) {
    for (const comp of cat.components) {
      const exportNames = await getExportNames(comp)
      const typeContent = await tryReadFile(join(TYPES_DIR, `${comp}.ts`))
      const desc = typeContent ? extractDescription(typeContent, comp) : ''
      lines.push(`| ${comp} | ${cat.label} | ${exportNames.join(', ')} | ${desc} |`)
    }
  }

  return lines.join('\n') + '\n'
}

interface Manifest {
  syncedAt: string
  totalComponents: number
  categories: Record<string, { label: string; components: string[] }>
  sharedTypes: string[]
}

async function main(): Promise<void> {
  console.log('[sync] syncing veltra-desktop docs...')

  if (!existsSync(TYPES_DIR)) {
    console.error(`[sync] types dir not found: ${TYPES_DIR}`)
    process.exit(1)
  }

  await rm(GENERATED_DIR, { recursive: true, force: true })
  await mkdir(GENERATED_DIR, { recursive: true })

  let totalComponents = 0
  const categoryManifest: Manifest['categories'] = {}

  for (const [key, cat] of Object.entries(CATEGORIES)) {
    console.log(`  ${cat.label} (${cat.components.length})`)
    const content = await generateCategoryFile(cat)
    await writeFile(join(GENERATED_DIR, cat.file), content, 'utf-8')
    totalComponents += cat.components.length
    categoryManifest[key] = { label: cat.label, components: cat.components }
  }

  console.log(`  共享类型 (${SHARED_TYPE_FILES.length})`)
  await writeFile(join(GENERATED_DIR, 'shared-types.md'), await generateSharedTypes(), 'utf-8')

  console.log('  组件目录')
  await writeFile(join(GENERATED_DIR, 'catalog.md'), await generateCatalog(), 'utf-8')

  const manifest: Manifest = {
    syncedAt: new Date().toISOString(),
    totalComponents,
    categories: categoryManifest,
    sharedTypes: SHARED_TYPE_FILES.map((f) => f.replace('.ts', ''))
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
