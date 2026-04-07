#!/usr/bin/env bun
/**
 * 将各 @cat-kit/* 包构建产物中的 .d.ts 镜像到 skills/use-cat-kit/generated/，
 * 使 use-cat-kit 技能与 npm 发布物（dist typings）一致。
 *
 * 用法（仓库根目录）：
 *   bun run sync-use-cat-kit-api              # 仅复制（需已构建 dist）
 *   bun run sync-use-cat-kit-api -- --build   # 先 tsdown/tsc 构建再复制
 */

import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile, copyFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildLib } from '../../../packages/maintenance/src/build/build.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '../../..')
const OUT_ROOT = join(__dirname, '../generated')

type Platform = 'neutral' | 'node' | 'browser'

const TSDOWN_PACKAGES: { name: string; platform?: Platform }[] = [
  { name: 'core' },
  { name: 'http' },
  { name: 'fe', platform: 'browser' },
  { name: 'be', platform: 'node' },
  { name: 'excel' },
  { name: 'maintenance', platform: 'node' }
]

const TSC_PACKAGES = ['agent-context', 'cli'] as const

async function walkDtsFiles(dir: string): Promise<string[]> {
  const out: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      out.push(...(await walkDtsFiles(p)))
    } else if (e.isFile() && e.name.endsWith('.d.ts')) {
      out.push(p)
    }
  }
  return out
}

async function readJson(path: string): Promise<{ name?: string; version?: string }> {
  const raw = await readFile(path, 'utf8')
  return JSON.parse(raw) as { name?: string; version?: string }
}

async function buildWithTsdown(): Promise<void> {
  for (const { name, platform = 'neutral' } of TSDOWN_PACKAGES) {
    const dir = join(REPO_ROOT, 'packages', name)
    if (!existsSync(join(dir, 'package.json'))) {
      console.warn(`[sync] skip missing package: ${name}`)
      continue
    }
    console.log(`[sync] tsdown: @cat-kit/${name} (${platform})`)
    const result = await buildLib({ dir, platform })
    if (!result.success) {
      throw new Error(`buildLib failed for ${name}: ${result.error?.message ?? 'unknown'}`)
    }
  }
}

async function buildWithTsc(pkg: string): Promise<void> {
  const tsconfig = join(REPO_ROOT, 'packages', pkg, 'tsconfig.json')
  if (!existsSync(tsconfig)) {
    console.warn(`[sync] skip tsc (no tsconfig): ${pkg}`)
    return
  }
  console.log(`[sync] tsc: @cat-kit/${pkg}`)
  const proc = Bun.spawnSync(['bun', 'x', 'tsc', '-p', tsconfig], {
    cwd: REPO_ROOT,
    stdout: 'inherit',
    stderr: 'inherit'
  })
  if (proc.exitCode !== 0) {
    throw new Error(`tsc failed for ${pkg} (exit ${proc.exitCode})`)
  }
}

async function mirrorPackageDist(pkg: string): Promise<number> {
  const dist = join(REPO_ROOT, 'packages', pkg, 'dist')
  if (!existsSync(dist)) {
    console.warn(`[sync] no dist for ${pkg}, skip copy`)
    return 0
  }

  const files = await walkDtsFiles(dist)
  let n = 0
  for (const abs of files) {
    const rel = relative(dist, abs)
    const dest = join(OUT_ROOT, pkg, rel)
    await mkdir(dirname(dest), { recursive: true })
    await copyFile(abs, dest)
    n++
  }
  return n
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const doBuild = args.includes('--build')

  if (doBuild) {
    await buildWithTsdown()
    for (const p of TSC_PACKAGES) {
      await buildWithTsc(p)
    }
  }

  await rm(OUT_ROOT, { recursive: true, force: true })
  await mkdir(OUT_ROOT, { recursive: true })

  const allNames = [...TSDOWN_PACKAGES.map((p) => p.name), ...TSC_PACKAGES]

  const manifest: {
    generatedAt: string
    repoRoot: string
    packages: Record<
      string,
      { npmName: string; version: string; dtsFiles: number; distRelative: string }
    >
  } = { generatedAt: new Date().toISOString(), repoRoot: REPO_ROOT, packages: {} }

  let total = 0
  for (const pkg of allNames) {
    const pkgJsonPath = join(REPO_ROOT, 'packages', pkg, 'package.json')
    let npmName = `@cat-kit/${pkg}`
    let version = '0.0.0'
    if (existsSync(pkgJsonPath)) {
      const pj = await readJson(pkgJsonPath)
      if (pj.name) npmName = pj.name
      if (pj.version) version = pj.version
    }

    const count = await mirrorPackageDist(pkg)
    total += count
    manifest.packages[pkg] = {
      npmName,
      version,
      dtsFiles: count,
      distRelative: `packages/${pkg}/dist`
    }
  }

  await writeFile(join(OUT_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')

  await writeFile(
    join(OUT_ROOT, 'README.md'),
    `# generated — npm typings 镜像

本目录由脚本生成，**勿手改**。内容与各包 \`packages/<name>/dist/**/*.d.ts\` 一致（与 npm 发布物 typings 对齐）。

- 生成：仓库根执行 \`bun run sync-use-cat-kit-api\`（已构建 dist）或 \`bun run sync-use-cat-kit-api -- --build\`
- 入口：各包从 \`<pkg>/index.d.ts\` 读起（如 \`core/index.d.ts\`）
- 元数据：\`manifest.json\`
`,
    'utf8'
  )

  console.log(`[sync] done: ${total} .d.ts files → ${relative(REPO_ROOT, OUT_ROOT)}`)
  if (total === 0 && !doBuild) {
    console.error('[sync] hint: dist empty; run with --build or build packages first')
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
