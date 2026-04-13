#!/usr/bin/env bun
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SKILL_DIR = join(__dirname, '..')
const ROOT = join(__dirname, '../../..')
const UTILS_SRC = join(ROOT, 'packages/utils/src')
const GENERATED_DIR = join(SKILL_DIR, 'generated')

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

const API_SECTION_ORDER: { id: ApiSection; title: string }[] = [
  { id: 'entry', title: '包入口' },
  { id: 'dom', title: 'DOM' },
  { id: 'form', title: '表单校验' },
  { id: 'helper', title: '辅助' },
  { id: 'reactive', title: '响应式' }
]

interface Manifest {
  syncedAt: string
  sourceRoot: string
  apiReference: { section: string; files: string[] }[]
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
  await mkdir(GENERATED_DIR, { recursive: true })

  const apiParts: string[] = [
    '# @veltra/utils — 源码镜像（工具与 DOM 等）\n',
    '',
    '> 由 `skills/veltra-utils/scripts/sync-docs.ts` 自 `packages/utils/src/` 生成（不含 `shared/`、`types/`，见 `shared-types.md`）。',
    ''
  ]

  const manifestApi: Manifest['apiReference'] = []

  for (const { id, title } of API_SECTION_ORDER) {
    const files = bySection.get(id)!
    if (files.length === 0) continue
    manifestApi.push({ section: title, files: files.map((x) => x.rel) })
    apiParts.push(`## ${title}\n`)
    for (const { rel, abs } of files) {
      const content = (await readFile(abs, 'utf-8')).trimEnd()
      apiParts.push(`### \`${rel}\`\n`)
      apiParts.push('```typescript')
      apiParts.push(`// 来源: packages/utils/src/${rel}`)
      apiParts.push(content)
      apiParts.push('```\n')
    }
  }

  await writeFile(join(GENERATED_DIR, 'api-reference.md'), apiParts.join('\n') + '\n', 'utf-8')

  const stParts: string[] = [
    '# @veltra/utils — 共享常量与类型源码\n',
    '',
    '> 由 `skills/veltra-utils/scripts/sync-docs.ts` 自 `packages/utils/src/shared/` 与 `packages/utils/src/types/` 生成。',
    ''
  ]

  for (const { rel, abs } of sharedList) {
    stParts.push(`## \`${rel}\`\n`)
    const content = (await readFile(abs, 'utf-8')).trimEnd()
    stParts.push('```typescript')
    stParts.push(`// 来源: packages/utils/src/${rel}`)
    stParts.push(content)
    stParts.push('```\n')
  }

  await writeFile(join(GENERATED_DIR, 'shared-types.md'), stParts.join('\n') + '\n', 'utf-8')

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
