#!/usr/bin/env bun

import { constants } from 'node:fs'
import { access, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  HELPERS_BY_KEBAB,
  parseApiTitleLine,
  renderComponentApiMd
} from './veltra-component-skill-meta'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const SKILL_ROOT = join(REPO_ROOT, 'skills/veltra-ui')
const GENERATED_DIR = join(SKILL_ROOT, 'generated')
const COMPONENTS_DOC_DIR = join(SKILL_ROOT, 'packages/desktop/components')
const COMPONENTS_SRC_DIR = join(REPO_ROOT, 'packages/desktop/src/components')
const TYPES_SRC_DIR = join(REPO_ROOT, 'packages/desktop/src/types')
const TOKENS_FILE = join(SKILL_ROOT, 'design-system/tokens.css')
const SKILL_MD = join(SKILL_ROOT, 'SKILL.md')

const PACKAGE_DIRS = {
  desktop: join(REPO_ROOT, 'packages/desktop'),
  compositions: join(REPO_ROOT, 'packages/compositions'),
  directives: join(REPO_ROOT, 'packages/directives'),
  icons: join(REPO_ROOT, 'packages/icons'),
  styles: join(REPO_ROOT, 'packages/styles'),
  utils: join(REPO_ROOT, 'packages/utils'),
  vite: join(REPO_ROOT, 'packages/vite')
} as const

type PackageName = keyof typeof PACKAGE_DIRS

type ComponentEntry = {
  name: string
  kebab: string
  docPath: string
  examplesPath: string | null
  isFormControl: boolean
}

type ExampleEntry = {
  file: string
  component: string
  titles: string[]
  valid: boolean
  errors: string[]
}

async function readPackageVersion(name: PackageName): Promise<string> {
  const raw = await readFile(join(PACKAGE_DIRS[name], 'package.json'), 'utf8')
  const json = JSON.parse(raw) as { version?: string }

  if (!json.version) {
    throw new Error(`缺少 version: ${name}`)
  }

  return json.version
}

async function collectComponentEntries(): Promise<ComponentEntry[]> {
  const entries = await readdir(COMPONENTS_SRC_DIR, { withFileTypes: true })
  const dirEntries = entries.filter((entry) => entry.isDirectory())

  const grouped = await Promise.all(
    dirEntries.map(async (entry) => {
      const kebab = entry.name
      const indexPath = join(COMPONENTS_SRC_DIR, kebab, 'index.ts')

      let indexContent = ''

      try {
        indexContent = await readFile(indexPath, 'utf8')
      } catch {
        return [] as ComponentEntry[]
      }

      const exportMatches = [...indexContent.matchAll(/export\s+\{\s*default\s+as\s+(\w+)/g)]
      const names = exportMatches.map((match) => match[1]!).filter(Boolean)

      if (names.length === 0) {
        return [] as ComponentEntry[]
      }

      const docPath = `packages/desktop/components/${kebab}/api.md`
      const examplesRelPath = `packages/desktop/components/${kebab}/examples.md`
      const typesPath = join(TYPES_SRC_DIR, `${kebab}.ts`)
      let isFormControl = false

      try {
        const typesContent = await readFile(typesPath, 'utf8')
        isFormControl = /extends\s+FormComponentProps/.test(typesContent)
      } catch {
        isFormControl = false
      }

      let hasExamples = false

      try {
        await readFile(join(SKILL_ROOT, examplesRelPath), 'utf8')
        hasExamples = true
      } catch {
        hasExamples = false
      }

      return names.map((name) => ({
        name,
        kebab,
        docPath,
        examplesPath: hasExamples ? examplesRelPath : null,
        isFormControl
      }))
    })
  )

  return grouped.flat().toSorted((a, b) => a.name.localeCompare(b.name))
}

function parseBarrelExports(content: string): string[] {
  return [...content.matchAll(/export\s+\{\s*default\s+as\s+(\w+)/g)].map((match) => match[1]!)
}

async function collectIconExports(): Promise<{ normal: string[]; colorful: string[] }> {
  const normal = await readFile(join(PACKAGE_DIRS.icons, 'src/normal.ts'), 'utf8')
  const colorful = await readFile(join(PACKAGE_DIRS.icons, 'src/colorful.ts'), 'utf8')

  return {
    normal: parseBarrelExports(normal).toSorted(),
    colorful: parseBarrelExports(colorful).toSorted()
  }
}

async function resolveModuleFile(
  packageDir: string,
  fromDir: string,
  specifier: string
): Promise<string> {
  const basePath = join(fromDir, specifier)

  if (specifier.endsWith('.ts')) {
    return basePath
  }

  const candidates = [`${basePath}.ts`, join(basePath, 'index.ts')]
  const resolvedCandidates = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        await access(candidate, constants.F_OK)
        return candidate
      } catch {
        return null
      }
    })
  )
  const resolved = resolvedCandidates.find((candidate) => candidate !== null)

  if (!resolved) {
    throw new Error(`无法解析模块: ${specifier}`)
  }

  return resolved
}

async function collectModuleExports(
  packageDir: string,
  entryRelativePath: string,
  visited = new Set<string>()
): Promise<string[]> {
  const entryPath = join(packageDir, entryRelativePath)

  if (visited.has(entryPath)) {
    return []
  }

  visited.add(entryPath)
  const content = await readFile(entryPath, 'utf8')
  const names = new Set<string>()

  for (const match of content.matchAll(/^export\s+(?:async\s+)?function\s+(\w+)/gm)) {
    names.add(match[1]!)
  }

  for (const match of content.matchAll(/^export\s+const\s+(\w+)/gm)) {
    names.add(match[1]!)
  }

  for (const match of content.matchAll(/^export\s+class\s+(\w+)/gm)) {
    names.add(match[1]!)
  }

  for (const match of content.matchAll(/^export\s+\{\s*([^}]+)\s*\}/gm)) {
    for (const part of match[1]!.split(',')) {
      const trimmed = part.trim()

      if (!trimmed || trimmed.startsWith('type ') || trimmed.startsWith('interface ')) {
        continue
      }

      const exportName = trimmed
        .split(/\s+as\s+/)
        .pop()
        ?.trim()

      if (exportName) {
        names.add(exportName)
      }
    }
  }

  const starMatches = [...content.matchAll(/^export\s+\*\s+from\s+['"](.+?)['"]/gm)]
  const starNestedLists = await Promise.all(
    starMatches.map(async (match) => {
      const resolved = await resolveModuleFile(packageDir, dirname(entryPath), match[1]!)
      const relativeEntry = relative(packageDir, resolved)
      return collectModuleExports(packageDir, relativeEntry, visited)
    })
  )

  for (const nested of starNestedLists.flat()) {
    names.add(nested)
  }

  const namedMatches = [...content.matchAll(/^export\s+\{([^}]+)\}\s+from\s+['"](.+?)['"]/gm)]
  const namedNestedLists = await Promise.all(
    namedMatches.map(async (match) => {
      const resolved = await resolveModuleFile(packageDir, dirname(entryPath), match[2]!)
      const relativeEntry = relative(packageDir, resolved)
      return collectModuleExports(packageDir, relativeEntry, visited)
    })
  )

  for (const nested of namedNestedLists.flat()) {
    names.add(nested)
  }

  return [...names].toSorted()
}

async function collectTokens(): Promise<string[]> {
  const content = await readFile(TOKENS_FILE, 'utf8')
  const tokens = new Set<string>()

  for (const match of content.matchAll(/--u-[a-z0-9-]+/g)) {
    tokens.add(match[0]!)
  }

  return [...tokens].toSorted()
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

  const legacyTypesDir = join(GENERATED_DIR, 'types')
  await rm(legacyTypesDir, { recursive: true, force: true })

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

        const helpers = HELPERS_BY_KEBAB[kebab] ?? []
        await writeFile(
          apiPath,
          renderComponentApiMd(parsed.names, parsed.chinese, helpers),
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

async function updateSkillFrontmatter(versions: Record<PackageName, string>): Promise<void> {
  const content = await readFile(SKILL_MD, 'utf8')
  const pattern = /(metadata:\s*\n\s*versions:\s*\n)([\s\S]*?)(\n+---)/

  if (!pattern.test(content)) {
    throw new Error('未能定位 SKILL.md frontmatter 中的 metadata.versions')
  }

  const versionLines = Object.entries(versions)
    .map(([name, version]) => `    ${name}: ${version}`)
    .join('\n')
  const updated = content.replace(pattern, `$1${versionLines}$3`)

  if (updated !== content) {
    await writeFile(SKILL_MD, updated, 'utf8')
  }
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function main(): Promise<void> {
  const versionEntries = await Promise.all(
    (Object.keys(PACKAGE_DIRS) as PackageName[]).map(
      async (name) => [name, await readPackageVersion(name)] as const
    )
  )
  const versions = Object.fromEntries(versionEntries) as Record<PackageName, string>

  const components = await collectComponentEntries()
  const icons = await collectIconExports()
  const directives = (await collectModuleExports(PACKAGE_DIRS.directives, 'src/index.ts')).filter(
    (name) => name.startsWith('v')
  )
  const compositions = await collectModuleExports(PACKAGE_DIRS.compositions, 'src/index.ts')
  const utils = await collectModuleExports(PACKAGE_DIRS.utils, 'src/index.ts')
  const tokens = await collectTokens()
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

  await mkdir(GENERATED_DIR, { recursive: true })

  const generatedAt = new Date().toISOString()

  await writeJson(join(GENERATED_DIR, 'manifest.json'), {
    generatedAt,
    versions,
    counts: {
      components: components.length,
      componentDocs: componentDocKebabs.length,
      exampleFiles: exampleEntries.length,
      icons: icons.normal.length + icons.colorful.length,
      directives: directives.length,
      compositions: compositions.length,
      utils: utils.length,
      tokens: tokens.length,
      types: typeCount
    }
  })

  await writeJson(join(GENERATED_DIR, 'components.json'), {
    generatedAt,
    version: versions.desktop,
    components
  })

  await writeJson(join(GENERATED_DIR, 'examples.json'), {
    generatedAt,
    version: versions.desktop,
    examples: exampleEntries.map(({ file, component, titles }) => ({ file, component, titles }))
  })

  await writeJson(join(GENERATED_DIR, 'icons.json'), {
    generatedAt,
    version: versions.icons,
    ...icons
  })

  await writeJson(join(GENERATED_DIR, 'directives.json'), {
    generatedAt,
    version: versions.directives,
    exports: directives
  })

  await writeJson(join(GENERATED_DIR, 'compositions.json'), {
    generatedAt,
    version: versions.compositions,
    exports: compositions
  })

  await writeJson(join(GENERATED_DIR, 'utils.json'), {
    generatedAt,
    version: versions.utils,
    exports: utils
  })

  await writeJson(join(GENERATED_DIR, 'tokens.json'), {
    generatedAt,
    version: versions.styles,
    tokens
  })

  await updateSkillFrontmatter(versions)

  console.log('[gen-veltra-skill] generated skill indexes')
  console.log(
    `  components=${components.length} examples=${exampleEntries.length} types=${typeCount} apiDocs=${apiDocCount}`
  )
  console.log(`  icons=${icons.normal.length + icons.colorful.length} tokens=${tokens.length}`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[gen-veltra-skill] ${message}`)
  process.exit(1)
})
