#!/usr/bin/env bun

/**
 * 辅助生成面向 docs-mcp 检索优化的自闭合组件单文件文档（<component>.md）。
 *
 * 扫描 packages/desktop、packages/ai、packages/sheet，
 * 提取各组件导出的 Props/Emits 类型定义与 playground / 现有示例，
 * 自动展开内联常用复合类型，识别表单控件并注入 UForm 避坑硬规则。
 *
 * 用法：
 *   bun run scripts/gen-agent-docs.ts                  # 扫描全量组件，打印概览并输出 input.md 示例骨架
 *   bun run scripts/gen-agent-docs.ts <component>      # 输出指定组件的单文件文档骨架到 stdout
 *   bun run scripts/gen-agent-docs.ts --write          # 将全量组件单文件文档写入 agent-docs/ 目录
 *   bun run scripts/gen-agent-docs.ts --write <comp>   # 将指定组件单文件文档写入 agent-docs/ 目录
 *   bun run scripts/gen-agent-docs.ts --check          # 校验全量组件文档元数据生成与类型展开
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  CHINESE_BY_KEBAB,
  HELPERS_BY_KEBAB,
  NOTES_BY_KEBAB,
  inlineCompositeTypes,
  isFormInputControl,
  parseApiTitleLine,
  renderComponentSingleDoc,
  UFORM_RULE_WARNING
} from './veltra-component-skill-meta'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const AGENT_DOCS_ROOT = join(REPO_ROOT, 'agent-docs')
const PACKAGES = ['desktop', 'ai', 'sheet'] as const

type PackageName = (typeof PACKAGES)[number]

export interface ScannedComponentMeta {
  pkg: PackageName
  kebab: string
  names: string[]
  chinese: string
  isFormInput: boolean
}

const EXPORT_BLOCK_RE = /export\s+(type\s+)?\{([^}]*)\}/g

/** 从 index.ts 取出导出的 `U*` 组件名 */
function extractComponentNames(source: string): string[] {
  const names: string[] = []

  for (const [, typeOnly, specifiers] of source.matchAll(EXPORT_BLOCK_RE)) {
    if (typeOnly || !specifiers) continue

    for (const specifier of specifiers.split(',')) {
      const trimmed = specifier.trim()
      if (!trimmed || trimmed.startsWith('type ')) continue

      const exported = trimmed
        .split(/\s+as\s+/)
        .at(-1)!
        .trim()
      if (/^U[A-Z]/.test(exported)) names.push(exported)
    }
  }

  return names
}

async function readIfExists(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return undefined
  }
}

/** 扫描 packages/desktop、packages/ai、packages/sheet 下的所有标准组件 */
export async function scanAllComponents(): Promise<ScannedComponentMeta[]> {
  const scanned = await Promise.all(
    PACKAGES.map(async (pkg) => {
      const scanRoot = join(REPO_ROOT, 'packages', pkg, 'src/components')
      const entries = await readdir(scanRoot, { withFileTypes: true }).catch(() => [])

      const dirs = await Promise.all(
        entries
          .filter((entry) => entry.isDirectory())
          .map(async (entry) => {
            const dir = join(scanRoot, entry.name)
            const [index, style] = await Promise.all([
              readIfExists(join(dir, 'index.ts')),
              readIfExists(join(dir, 'style.ts'))
            ])

            if (index === undefined || style === undefined) return undefined

            const names = extractComponentNames(index)
            if (names.length === 0) return undefined

            const chinese = await resolveChineseName(pkg, entry.name)
            const isFormInput = isFormInputControl(entry.name)

            return { pkg, kebab: entry.name, names, chinese, isFormInput }
          })
      )

      return dirs.filter((item): item is ScannedComponentMeta => item !== undefined)
    })
  )

  return scanned.flat().toSorted((a, b) => {
    const pkgCmp = a.pkg.localeCompare(b.pkg)
    return pkgCmp !== 0 ? pkgCmp : a.kebab.localeCompare(b.kebab)
  })
}

/** 解析组件中文名 */
async function resolveChineseName(pkg: PackageName, kebab: string): Promise<string> {
  const mapped = CHINESE_BY_KEBAB[kebab]
  if (mapped) return mapped

  const candidatePaths = [
    join(AGENT_DOCS_ROOT, pkg, `${kebab}.md`),
    join(AGENT_DOCS_ROOT, pkg, kebab, 'api.md'),
    join(REPO_ROOT, 'skills/veltra-ui/packages/desktop/components', kebab, 'api.md')
  ]

  const contents = await Promise.all(candidatePaths.map(readIfExists))
  for (const existing of contents) {
    if (existing) {
      const titleLine =
        existing.split('\n').find((line) => /^#{1,2}\s+\S.+\s+-\s+.+$/.test(line.trim())) ?? ''
      const parsed = parseApiTitleLine(titleLine)
      if (parsed?.chinese) return parsed.chinese
    }
  }

  return ''
}

/** 从 existing examples.md、skill examples 或 playground 提取示例内容与描述 */
async function resolveComponentExamplesAndDesc(
  pkg: PackageName,
  kebab: string
): Promise<{ examples: string | undefined; description: string | undefined }> {
  // 1. 优先读取已有的 agent-docs/<pkg>/<kebab>/examples.md
  const agentDocExamplePath = join(AGENT_DOCS_ROOT, pkg, kebab, 'examples.md')
  const agentDocExample = await readIfExists(agentDocExamplePath)
  if (agentDocExample) {
    const descMatch = agentDocExample.match(/^description:\s*(.+)$/m)
    let description = descMatch?.[1]?.trim()
    if (description && (description.startsWith('"') || description.startsWith("'"))) {
      description = description.slice(1, -1)
    }
    return { examples: agentDocExample, description }
  }

  // 2. 其次尝试读取 skills/veltra-ui
  const skillExamplePath = join(
    REPO_ROOT,
    'skills/veltra-ui/packages/desktop/components',
    kebab,
    'examples.md'
  )
  const skillExample = await readIfExists(skillExamplePath)
  if (skillExample) {
    return { examples: skillExample, description: undefined }
  }

  // 3. 兜底尝试读取 playground 示例
  const playgroundPaths = [
    join(REPO_ROOT, 'playground/src', pkg, kebab, 'index.vue'),
    join(REPO_ROOT, 'playground/src', kebab, 'index.vue')
  ]
  const playgroundContents = await Promise.all(playgroundPaths.map(readIfExists))
  for (const playContent of playgroundContents) {
    if (playContent) {
      return {
        examples: `### 基础用法\n\n\`\`\`vue\n${playContent.trim()}\n\`\`\``,
        description: undefined
      }
    }
  }

  return { examples: undefined, description: undefined }
}

/** 提取并内联展开组件的类型定义源码 */
async function resolveInlinedTypes(pkg: PackageName, kebab: string): Promise<string | undefined> {
  const typeSrcPath = join(REPO_ROOT, 'packages', pkg, 'src/types', `${kebab}.ts`)
  const rawTypes = await readIfExists(typeSrcPath)
  if (rawTypes === undefined) return undefined

  return inlineCompositeTypes(rawTypes, { typeDir: join(REPO_ROOT, 'packages', pkg, 'src/types') })
}

/**
 * 提取已有单文件文档中的自定义内容（半自动模式，不覆盖手工提炼的场景词、避坑点与示例）
 */
function extractCustomSectionsFromExistingDoc(existingDoc: string): {
  description?: string
  examples?: string
  notes?: string[]
} {
  const result: { description?: string; examples?: string; notes?: string[] } = {}

  // 提取 description
  const descMatch = existingDoc.match(/^description:\s*(.*)$/m)
  if (descMatch?.[1]?.trim()) {
    let desc = descMatch[1].trim()
    const firstChar = desc[0]
    if (firstChar && (firstChar === '"' || firstChar === "'") && desc.endsWith(firstChar)) {
      desc = desc.slice(1, -1)
    }
    result.description = desc
  }

  // 提取 ## 示例 与 ## API 之间的示例内容
  const examplesMatch = existingDoc.match(/## 示例\n\n([\s\S]*?)(?=\n## API|\n## 避坑|$)/)
  if (examplesMatch?.[1]?.trim()) {
    result.examples = examplesMatch[1].trim()
  }

  // 提取 ## 避坑与使用要点 下的列表项
  const notesMatch = existingDoc.match(/## 避坑与使用要点\n\n([\s\S]*?)(?=\n## |$)/)
  if (notesMatch?.[1]?.trim()) {
    const lines = notesMatch[1]
      .split('\n')
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter((line) => Boolean(line) && line !== UFORM_RULE_WARNING)
    if (lines.length > 0) {
      result.notes = lines
    }
  }

  return result
}

/** 生成组件自闭合单文件 Markdown 文本 */
export async function generateComponentSingleDoc(
  meta: ScannedComponentMeta,
  options: { existingDoc?: string } = {}
): Promise<string> {
  const { pkg, kebab, names, chinese, isFormInput } = meta
  const inlinedTypes = await resolveInlinedTypes(pkg, kebab)
  const { examples: rawExamples, description: rawDesc } = await resolveComponentExamplesAndDesc(
    pkg,
    kebab
  )

  const existingCustom = options.existingDoc
    ? extractCustomSectionsFromExistingDoc(options.existingDoc)
    : {}

  const description =
    existingCustom.description ??
    rawDesc ??
    `${names.join(' / ')}${chinese ? ` (${chinese})` : ''} 组件，属于 @veltra/${pkg}。${
      isFormInput
        ? '表单输入控件，支持在 UForm 内由 field 自动接管状态绑定与校验。'
        : '提供丰富的配置项与插槽，适用于各类业务场景。'
    }`

  const examples = existingCustom.examples ?? rawExamples
  const helpers = HELPERS_BY_KEBAB[kebab] ?? []
  const note = NOTES_BY_KEBAB[kebab]
  const notes = existingCustom.notes ?? []

  return renderComponentSingleDoc({
    pkg,
    kebab,
    names,
    chinese,
    description,
    examples,
    typesContent: inlinedTypes,
    helpers,
    note,
    notes,
    isFormInput
  })
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const isWrite = args.includes('--write') || args.includes('-w')
  const isCheck = args.includes('--check')
  const isForce = args.includes('--force') || args.includes('-f')

  let outDir = AGENT_DOCS_ROOT
  const outDirIdx = args.findIndex((arg) => arg === '--out-dir')
  if (outDirIdx !== -1 && args[outDirIdx + 1]) {
    outDir = resolve(REPO_ROOT, args[outDirIdx + 1]!)
  }

  const targetKebab = args.find((arg) => !arg.startsWith('-'))

  const components = await scanAllComponents()
  const formControls = components.filter((c) => c.isFormInput)

  if (isCheck) {
    await Promise.all(
      components.map(async (comp) => {
        const doc = await generateComponentSingleDoc(comp)
        if (!doc.includes('## 引入') || !doc.includes('## API / 类型')) {
          throw new Error(`组件骨架结构异常: ${comp.kebab}`)
        }
        if (comp.isFormInput && !doc.includes(UFORM_RULE_WARNING)) {
          throw new Error(`表单控件缺失 UForm 避坑规则: ${comp.kebab}`)
        }
      })
    )
    console.log(
      `[gen-agent-docs] check passed: ${components.length} components verified (form controls: ${formControls.length})`
    )
    return
  }

  if (targetKebab && !isWrite) {
    const match = components.find((c) => c.kebab === targetKebab)
    if (!match) {
      console.error(`[gen-agent-docs] 未找到组件: ${targetKebab}`)
      process.exit(1)
    }

    const doc = await generateComponentSingleDoc(match)
    console.log(doc)
    return
  }

  if (isWrite) {
    const targets = targetKebab ? components.filter((c) => c.kebab === targetKebab) : components

    if (targets.length === 0) {
      console.error(`[gen-agent-docs] 未找到匹配的组件: ${targetKebab}`)
      process.exit(1)
    }

    let written = 0
    await Promise.all(
      targets.map(async (comp) => {
        const targetFile = join(outDir, comp.pkg, `${comp.kebab}.md`)
        await mkdir(dirname(targetFile), { recursive: true })

        const existingDoc = isForce ? undefined : await readIfExists(targetFile)
        const doc = await generateComponentSingleDoc(comp, { existingDoc })
        await writeFile(targetFile, doc, 'utf8')
        written += 1
      })
    )

    console.log(`[gen-agent-docs] 成功写入 ${written} 篇组件文档到 ${outDir}/`)
    return
  }

  // 默认模式：打印扫描结果并预览代表性表单输入控件骨架
  console.log(`[gen-agent-docs] 扫描完成，共识别 ${components.length} 个组件:`)
  const byPkg = Object.groupBy(components, (c) => c.pkg)
  for (const pkg of PACKAGES) {
    console.log(`  - packages/${pkg}: ${byPkg[pkg]?.length ?? 0} 个组件`)
  }
  console.log(`  - 表单输入类控件: ${formControls.length} 个 (自动注入 UForm 避坑规则)`)

  const sampleComp = components.find((c) => c.kebab === 'input') ?? components[0]!
  const sampleDoc = await generateComponentSingleDoc(sampleComp)

  console.log('\n' + '='.repeat(80))
  console.log(`示例单文件骨架预览 (${sampleComp.pkg}/${sampleComp.kebab}.md):`)
  console.log('='.repeat(80))
  console.log(sampleDoc)
  console.log('='.repeat(80))
  console.log('\n[gen-agent-docs] 提示:')
  console.log('  - 查看指定组件骨架: bun run scripts/gen-agent-docs.ts <component>')
  console.log('  - 写入指定组件文档: bun run scripts/gen-agent-docs.ts --write <component>')
  console.log('  - 全量写入单文件文档: bun run scripts/gen-agent-docs.ts --write')
  console.log('  - 校验全量组件文档: bun run scripts/gen-agent-docs.ts --check\n')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[gen-agent-docs] ${message}`)
  process.exit(1)
})
