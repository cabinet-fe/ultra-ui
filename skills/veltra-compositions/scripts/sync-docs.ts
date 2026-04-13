#!/usr/bin/env bun
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SKILL_DIR = join(__dirname, '..')
const ROOT = join(__dirname, '../../..')
const COMPOSITIONS_SRC = join(ROOT, 'packages/compositions/src')
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
    } else if (e.isFile() && e.name.endsWith('.ts') && !e.name.endsWith('.d.ts')) {
      out.push({ rel, abs })
    }
  }
  return out
}

interface Manifest {
  syncedAt: string
  sourceRoot: string
  modules: { name: string; files: string[] }[]
}

async function main(): Promise<void> {
  console.log('[sync] syncing veltra-compositions docs...')

  if (!existsSync(COMPOSITIONS_SRC)) {
    console.error(`[sync] compositions src not found: ${COMPOSITIONS_SRC}`)
    process.exit(1)
  }

  const top = await readdir(COMPOSITIONS_SRC, { withFileTypes: true })
  const modules = top
    .filter((e) => e.isDirectory() && e.name.startsWith('use-'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b))

  await rm(GENERATED_DIR, { recursive: true, force: true })
  await mkdir(GENERATED_DIR, { recursive: true })

  const manifestModules: Manifest['modules'] = []
  const apiParts: string[] = [
    '# @veltra/compositions — 源码与类型\n',
    '',
    `> 由 \`skills/veltra-compositions/scripts/sync-docs.ts\` 自 \`packages/compositions/src/\` 生成。`,
    ''
  ]

  for (const mod of modules) {
    const modDir = join(COMPOSITIONS_SRC, mod)
    const files = await walkTsFiles(modDir, mod)
    const relPaths = files.map((f) => f.rel).sort((a, b) => a.localeCompare(b))
    manifestModules.push({ name: mod, files: relPaths })

    apiParts.push(`## ${mod}\n`)
    for (const { rel, abs } of files) {
      const content = (await readFile(abs, 'utf-8')).trimEnd()
      apiParts.push(`### \`${rel}\`\n`)
      apiParts.push('```typescript')
      apiParts.push(`// 来源: packages/compositions/src/${rel}`)
      apiParts.push(content)
      apiParts.push('```\n')
    }
  }

  await writeFile(join(GENERATED_DIR, 'api-reference.md'), apiParts.join('\n') + '\n', 'utf-8')

  const manifest: Manifest = {
    syncedAt: new Date().toISOString(),
    sourceRoot: 'packages/compositions/src',
    modules: manifestModules
  }
  await writeFile(
    join(GENERATED_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf-8'
  )

  console.log(`[sync] done: ${modules.length} modules → generated/api-reference.md`)
}

main().catch((e: unknown) => {
  console.error('[sync] failed:', e)
  process.exit(1)
})
