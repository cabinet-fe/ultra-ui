#!/usr/bin/env bun

import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  HELPERS_BY_KEBAB,
  INTRO_BY_KEBAB,
  parseApiTitleLine,
  renderComponentApiMd
} from './veltra-component-skill-meta'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const SKILL_ROOT = join(REPO_ROOT, 'skills/veltra-ui')
const GENERATED_DIR = join(SKILL_ROOT, 'generated')
const COMPONENTS_DOC_DIR = join(SKILL_ROOT, 'packages/desktop/components')
const TYPES_SRC_DIR = join(REPO_ROOT, 'packages/desktop/src/types')
type ExampleEntry = {
  file: string
  component: string
  titles: string[]
  valid: boolean
  errors: string[]
}

function validateExamplesFile(relativePath: string, content: string): ExampleEntry {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const titleLine = lines[0] ?? ''
  const componentMatch = titleLine.match(/\bU[A-Z][A-Za-z0-9]*/)
  const component = componentMatch?.[0] ?? basename(relativePath, '.examples.md')
  const errors: string[] = []
  const titles: string[] = []

  if (!titleLine.startsWith('# ')) {
    errors.push('首行必须是 # 标题')
  }

  const sections = content.split(/^## /m).slice(1)

  if (sections.length === 0) {
    errors.push('至少需要一个 ## 示例标题')
  }

  for (const section of sections) {
    const sectionLines = section.split('\n')
    const title = sectionLines[0]?.trim() ?? ''

    if (!title) {
      errors.push('存在空的 ## 标题')
      continue
    }

    titles.push(title)
    const body = sectionLines.slice(1).join('\n').trim()
    const codeBlocks = [...body.matchAll(/```[\s\S]*?```/g)].map((match) => match[0]!)

    if (codeBlocks.length !== 1) {
      errors.push(`「${title}」必须紧跟恰好一段代码块（当前 ${codeBlocks.length} 段）`)
      continue
    }

    const withoutCode = body.replace(/```[\s\S]*?```/g, '').trim()
    const nonCodeLines = withoutCode
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (nonCodeLines.length > 1) {
      errors.push(`「${title}」标题与代码之间最多允许一行说明`)
    }
  }

  return { file: relativePath, component, titles, valid: errors.length === 0, errors }
}

async function collectExamplesIndex(): Promise<{
  entries: ExampleEntry[]
  invalid: ExampleEntry[]
}> {
  const entries = await readdir(COMPONENTS_DOC_DIR, { withFileTypes: true })
  const componentDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)

  const exampleEntries = await Promise.all(
    componentDirs.map(async (kebab) => {
      const relativePath = `packages/desktop/components/${kebab}/examples.md`
      const content = await readFile(join(COMPONENTS_DOC_DIR, kebab, 'examples.md'), 'utf8')
      return validateExamplesFile(relativePath, content)
    })
  )

  return { entries: exampleEntries, invalid: exampleEntries.filter((entry) => !entry.valid) }
}

function prepareTypeMirrorContent(content: string): string {
  return content
    .replace(
      /import type \{ NestedFieldMarker \} from '\.\.\/components\/form\/helper'\n\n/,
      `export interface NestedFieldMarker<T extends Record<string, any> = Record<string, any>> {
  __isNested: true
  fields: T
}

`
    )
    .trimEnd()
}

async function listComponentDocKebabs(): Promise<string[]> {
  const entries = await readdir(COMPONENTS_DOC_DIR, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted()
}

async function mirrorComponentTypeFiles(componentKebabs: string[]): Promise<number> {
  let count = 0

  await Promise.all(
    componentKebabs.map(async (kebab) => {
      const srcPath = join(TYPES_SRC_DIR, `${kebab}.ts`)
      const targetPath = join(COMPONENTS_DOC_DIR, kebab, 'types.d.ts')

      try {
        const raw = await readFile(srcPath, 'utf8')
        await mkdir(dirname(targetPath), { recursive: true })
        await writeFile(targetPath, `${prepareTypeMirrorContent(raw)}\n`, 'utf8')
        count += 1
      } catch {
        // 无对应类型文件的组件目录跳过
      }
    })
  )

  return count
}

async function regenerateComponentApiDocs(componentKebabs: string[]): Promise<number> {
  let count = 0

  await Promise.all(
    componentKebabs.map(async (kebab) => {
      const apiPath = join(COMPONENTS_DOC_DIR, kebab, 'api.md')

      try {
        const existing = await readFile(apiPath, 'utf8')
        const titleLine =
          existing.split('\n').find((line) => /^#{1,2}\s+\S.+\s+-\s+.+$/.test(line.trim())) ?? ''
        const parsed = parseApiTitleLine(titleLine)

        if (!parsed) {
          throw new Error(`无法解析标题: ${kebab}`)
        }

        const intro = INTRO_BY_KEBAB[kebab]

        if (!intro) {
          throw new Error(`缺少组件简介: ${kebab}`)
        }

        const helpers = HELPERS_BY_KEBAB[kebab] ?? []
        await writeFile(
          apiPath,
          renderComponentApiMd(parsed.names, parsed.chinese, intro, helpers),
          'utf8'
        )
        count += 1
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.warn(`[gen-veltra-skill] 跳过 api.md: ${kebab} (${message})`)
      }
    })
  )

  return count
}

async function main(): Promise<void> {
  const { entries: exampleEntries, invalid: invalidExamples } = await collectExamplesIndex()
  const componentDocKebabs = await listComponentDocKebabs()
  const typeCount = await mirrorComponentTypeFiles(componentDocKebabs)
  const apiDocCount = await regenerateComponentApiDocs(componentDocKebabs)

  if (invalidExamples.length > 0) {
    for (const entry of invalidExamples) {
      console.error(`[gen-veltra-skill] 示例格式错误: ${entry.file}`)

      for (const error of entry.errors) {
        console.error(`  - ${error}`)
      }
    }

    process.exit(1)
  }

  await rm(GENERATED_DIR, { recursive: true, force: true })

  console.log('[gen-veltra-skill] generated skill docs')
  console.log(
    `  componentDocs=${componentDocKebabs.length} examples=${exampleEntries.length} types=${typeCount} apiDocs=${apiDocCount}`
  )
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[gen-veltra-skill] ${message}`)
  process.exit(1)
})
