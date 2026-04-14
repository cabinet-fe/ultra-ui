#!/usr/bin/env bun
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { REPO_ROOT } from './repo-root.ts'

const SKILL_DIR = join(REPO_ROOT, 'skills/veltra-compositions')
const COMPOSITIONS_SRC = join(REPO_ROOT, 'packages/compositions/src')
const GENERATED_DIR = join(SKILL_DIR, 'generated')
const MODULES_DIR = join(GENERATED_DIR, 'modules')

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
  modules: { name: string; files: string[]; docFile: string }[]
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
  await mkdir(MODULES_DIR, { recursive: true })

  const manifestModules: Manifest['modules'] = []

  for (const mod of modules) {
    const modDir = join(COMPOSITIONS_SRC, mod)
    const files = await walkTsFiles(modDir, mod)
    const relPaths = files.map((f) => f.rel).sort((a, b) => a.localeCompare(b))
    const docFile = `modules/${mod}.md`
    manifestModules.push({ name: mod, files: relPaths, docFile })

    const blocks: string[] = []
    for (const { abs } of files) {
      const content = (await readFile(abs, 'utf-8')).trimEnd()
      blocks.push('```typescript\n' + content + '\n```')
    }
    const body = blocks.join('\n\n---\n\n')
    await writeFile(join(GENERATED_DIR, docFile), `# ${mod}\n\n${body}\n`, 'utf-8')
  }

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

  console.log(`[sync] done: ${modules.length} modules → generated/modules/*.md`)
}

main().catch((e: unknown) => {
  console.error('[sync] failed:', e)
  process.exit(1)
})
