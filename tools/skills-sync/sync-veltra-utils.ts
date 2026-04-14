#!/usr/bin/env bun
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { REPO_ROOT } from './repo-root.ts'

const SKILL_DIR = join(REPO_ROOT, 'skills/veltra-utils')
const UTILS_SRC = join(REPO_ROOT, 'packages/utils/src')
const GENERATED_DIR = join(SKILL_DIR, 'generated')
const API_DIR = join(GENERATED_DIR, 'api')

async function walkTsFiles(dir: string, base: string): Promise<{ rel: string; abs: string }[]> {
  const out: { rel: string; abs: string }[] = []
  const entries = await readdir(dir, { withFileTypes: true })
  entries.sort((a, b) => a.name.localeCompare(b.name))
  for (const e of entries) {
    const abs = join(dir, e.name)
    const rel = join(base, e.name)
    if (e.isDirectory()) {
      out.push(...(await walkTsFiles(abs, rel)))
    } else if (
      e.isFile() &&
      e.name.endsWith('.ts') &&
      !e.name.endsWith('.d.ts') &&
      e.name !== 'env.d.ts'
    ) {
      out.push({ rel, abs })
    }
  }
  return out
}

type ApiSection = 'entry' | 'dom' | 'form' | 'helper' | 'reactive'

function apiSectionFor(rel: string): ApiSection | null {
  if (rel === 'index.ts') return 'entry'
  const seg = rel.split(/[/\\]/)[0]
  if (seg === 'dom') return 'dom'
  if (seg === 'form') return 'form'
  if (seg === 'helper') return 'helper'
  if (seg === 'reactive') return 'reactive'
  return null
}

function isSharedTypes(rel: string): boolean {
  return rel.startsWith('shared/') || rel.startsWith('types/')
}

const API_SECTION_ORDER: { id: ApiSection; title: string; file: string }[] = [
  { id: 'entry', title: '包入口', file: 'entry.md' },
  { id: 'dom', title: 'DOM', file: 'dom.md' },
  { id: 'form', title: '表单校验', file: 'form.md' },
  { id: 'helper', title: '辅助', file: 'helper.md' },
  { id: 'reactive', title: '响应式', file: 'reactive.md' }
]

interface Manifest {
  syncedAt: string
  sourceRoot: string
  apiReference: { section: string; files: string[]; docFile: string }[]
  sharedTypes: string[]
}

async function main(): Promise<void> {
  console.log('[sync] syncing veltra-utils docs...')

  if (!existsSync(UTILS_SRC)) {
    console.error(`[sync] utils src not found: ${UTILS_SRC}`)
    process.exit(1)
  }

  const allFiles = await walkTsFiles(UTILS_SRC, '')
  const bySection = new Map<ApiSection, { rel: string; abs: string }[]>()
  for (const s of API_SECTION_ORDER) {
    bySection.set(s.id, [])
  }
  const sharedList: { rel: string; abs: string }[] = []

  for (const f of allFiles) {
    if (isSharedTypes(f.rel)) {
      sharedList.push(f)
      continue
    }
    const sec = apiSectionFor(f.rel)
    if (sec) {
      bySection.get(sec)!.push(f)
    }
  }

  for (const list of bySection.values()) {
    list.sort((a, b) => a.rel.localeCompare(b.rel))
  }
  sharedList.sort((a, b) => a.rel.localeCompare(b.rel))

  await rm(GENERATED_DIR, { recursive: true, force: true })
  await mkdir(API_DIR, { recursive: true })

  const manifestApi: Manifest['apiReference'] = []

  for (const { id, title, file } of API_SECTION_ORDER) {
    const files = bySection.get(id)!
    if (files.length === 0) continue
    const docFile = `api/${file}`
    manifestApi.push({ section: title, files: files.map((x) => x.rel), docFile })

    const blocks: string[] = []
    for (const { abs } of files) {
      const content = (await readFile(abs, 'utf-8')).trimEnd()
      blocks.push('```typescript\n' + content + '\n```')
    }
    const body = blocks.join('\n\n---\n\n')
    await writeFile(
      join(GENERATED_DIR, docFile),
      `# @veltra/utils — ${title}\n\n${body}\n`,
      'utf-8'
    )
  }

  const stBlocks: string[] = []
  for (const { abs } of sharedList) {
    const content = (await readFile(abs, 'utf-8')).trimEnd()
    stBlocks.push('```typescript\n' + content + '\n```')
  }
  const stBody = stBlocks.join('\n\n---\n\n')

  await writeFile(
    join(GENERATED_DIR, 'shared-types.md'),
    `# @veltra/utils — 共享常量与类型源码\n\n${stBody}\n`,
    'utf-8'
  )

  const manifest: Manifest = {
    syncedAt: new Date().toISOString(),
    sourceRoot: 'packages/utils/src',
    apiReference: manifestApi,
    sharedTypes: sharedList.map((x) => x.rel)
  }
  await writeFile(
    join(GENERATED_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8'
  )

  const nApi = [...bySection.values()].reduce((n, a) => n + a.length, 0)
  console.log(`[sync] done: api ${nApi} files, shared/types ${sharedList.length} files`)
}

main().catch((e: unknown) => {
  console.error('[sync] failed:', e)
  process.exit(1)
})
