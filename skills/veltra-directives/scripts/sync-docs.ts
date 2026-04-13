#!/usr/bin/env bun
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SKILL_DIR = join(__dirname, '..')
const ROOT = join(__dirname, '../../..')
const DIRECTIVES_SRC = join(ROOT, 'packages/directives/src')
const GENERATED_DIR = join(SKILL_DIR, 'generated')

async function walkFiles(dir: string, base: string): Promise<{ rel: string; abs: string }[]> {
  const out: { rel: string; abs: string }[] = []
  const entries = await readdir(dir, { withFileTypes: true })
  entries.sort((a, b) => a.name.localeCompare(b.name))
  for (const e of entries) {
    const abs = join(dir, e.name)
    const rel = join(base, e.name)
    if (e.isDirectory()) {
      out.push(...(await walkFiles(abs, rel)))
    } else if (e.isFile()) {
      const okTs = e.name.endsWith('.ts') && !e.name.endsWith('.d.ts') && e.name !== 'env.d.ts'
      const okScss = e.name.endsWith('.scss')
      if (okTs || okScss) {
        out.push({ rel, abs })
      }
    }
  }
  return out
}

function directiveGroup(rel: string): string {
  if (rel === 'index.ts') return '包入口'
  const top = rel.split(/[/\\]/)[0]
  if (top === 'focus') return 'vFocus'
  if (top === 'click-outside') return 'vClickOutside'
  if (top === 'ripple') return 'vRipple'
  return top
}

const GROUP_ORDER = ['包入口', 'vFocus', 'vClickOutside', 'vRipple']

function fenceFor(rel: string): string {
  return rel.endsWith('.scss') ? 'scss' : 'typescript'
}

interface Manifest {
  syncedAt: string
  sourceRoot: string
  directives: { name: string; files: string[] }[]
}

async function main(): Promise<void> {
  console.log('[sync] syncing veltra-directives docs...')

  if (!existsSync(DIRECTIVES_SRC)) {
    console.error(`[sync] directives src not found: ${DIRECTIVES_SRC}`)
    process.exit(1)
  }

  const files = await walkFiles(DIRECTIVES_SRC, '')
  files.sort((a, b) => a.rel.localeCompare(b.rel))

  const grouped = new Map<string, { rel: string; abs: string }[]>()
  for (const g of GROUP_ORDER) {
    grouped.set(g, [])
  }
  for (const f of files) {
    const name = directiveGroup(f.rel)
    if (!grouped.has(name)) {
      grouped.set(name, [])
    }
    grouped.get(name)!.push(f)
  }

  await rm(GENERATED_DIR, { recursive: true, force: true })
  await mkdir(GENERATED_DIR, { recursive: true })

  const parts: string[] = [
    '# @veltra/directives — 源码与样式\n',
    '',
    '> 由 `skills/veltra-directives/scripts/sync-docs.ts` 自 `packages/directives/src/` 生成。',
    ''
  ]

  const manifestDirs: Manifest['directives'] = []

  for (const name of GROUP_ORDER) {
    const list = grouped.get(name)
    if (!list || list.length === 0) continue
    manifestDirs.push({ name, files: list.map((x) => x.rel) })
    parts.push(`## ${name}\n`)
    for (const { rel, abs } of list) {
      const content = (await readFile(abs, 'utf-8')).trimEnd()
      parts.push(`### \`${rel}\`\n`)
      parts.push('```' + fenceFor(rel))
      parts.push(`// 来源: packages/directives/src/${rel}`)
      parts.push(content)
      parts.push('```\n')
    }
  }

  for (const [name, list] of grouped) {
    if (GROUP_ORDER.includes(name)) continue
    if (list.length === 0) continue
    manifestDirs.push({ name, files: list.map((x) => x.rel) })
    parts.push(`## ${name}\n`)
    for (const { rel, abs } of list) {
      const content = (await readFile(abs, 'utf-8')).trimEnd()
      parts.push(`### \`${rel}\`\n`)
      parts.push('```' + fenceFor(rel))
      parts.push(`// 来源: packages/directives/src/${rel}`)
      parts.push(content)
      parts.push('```\n')
    }
  }

  await writeFile(join(GENERATED_DIR, 'api-reference.md'), parts.join('\n') + '\n', 'utf-8')

  const manifest: Manifest = {
    syncedAt: new Date().toISOString(),
    sourceRoot: 'packages/directives/src',
    directives: manifestDirs
  }
  await writeFile(
    join(GENERATED_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8'
  )

  console.log(`[sync] done: ${files.length} files → generated/api-reference.md`)
}

main().catch((e: unknown) => {
  console.error('[sync] failed:', e)
  process.exit(1)
})
