#!/usr/bin/env bun
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { REPO_ROOT } from './repo-root.ts'

const SKILL_DIR = join(REPO_ROOT, 'skills/veltra-directives')
const DIRECTIVES_SRC = join(REPO_ROOT, 'packages/directives/src')
const GENERATED_DIR = join(SKILL_DIR, 'generated')
const GROUPS_DIR = join(GENERATED_DIR, 'groups')

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

function slugForGroup(name: string): string {
  if (name === '包入口') return 'package-entry'
  const map: Record<string, string> = {
    vFocus: 'v-focus',
    vClickOutside: 'v-click-outside',
    vRipple: 'v-ripple'
  }
  return map[name] ?? name.toLowerCase().replace(/\s+/g, '-')
}

interface Manifest {
  syncedAt: string
  sourceRoot: string
  directives: { name: string; slug: string; files: string[]; docFile: string }[]
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
  await mkdir(GROUPS_DIR, { recursive: true })

  const manifestDirs: Manifest['directives'] = []

  const emitGroup = async (name: string, list: { rel: string; abs: string }[]): Promise<void> => {
    if (list.length === 0) return
    const slug = slugForGroup(name)
    const docFile = `groups/${slug}.md`
    manifestDirs.push({ name, slug, files: list.map((x) => x.rel), docFile })

    const blocks: string[] = []
    for (const { rel, abs } of list) {
      const content = (await readFile(abs, 'utf-8')).trimEnd()
      const lang = fenceFor(rel)
      blocks.push('```' + lang + '\n' + content + '\n```')
    }
    const body = blocks.join('\n\n---\n\n')
    await writeFile(
      join(GENERATED_DIR, docFile),
      `# @veltra/directives — ${name}\n\n${body}\n`,
      'utf-8'
    )
  }

  for (const name of GROUP_ORDER) {
    const list = grouped.get(name)
    if (list) await emitGroup(name, list)
  }

  for (const [name, list] of grouped) {
    if (GROUP_ORDER.includes(name)) continue
    await emitGroup(name, list)
  }

  const indexParts: string[] = ['# @veltra/directives — 索引\n', '', '按指令组分文件：', '']
  for (const d of manifestDirs) {
    indexParts.push(`- [${d.name}](${d.docFile})`)
  }
  indexParts.push('')
  await writeFile(join(GENERATED_DIR, 'index.md'), indexParts.join('\n'), 'utf-8')

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

  console.log(`[sync] done: ${files.length} files → generated/groups/*.md`)
}

main().catch((e: unknown) => {
  console.error('[sync] failed:', e)
  process.exit(1)
})
