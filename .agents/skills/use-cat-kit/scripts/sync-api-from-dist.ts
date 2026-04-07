#!/usr/bin/env bun
/**
 * 将各 @cat-kit/* 包构建产物中的 .d.ts 镜像到 skills/use-cat-kit/generated/，
 * 使 use-cat-kit 技能与 npm 发布物（dist typings）一致。
 *
 * 用法（仓库根目录）：
 *   bun run sync-use-cat-kit-api              # 从 node_modules 或 packages 下各 @cat-kit 包的 dist 复制 .d.ts
 *   bun run sync-use-cat-kit-api -- --build   # 仅 cat-kit 单仓：先 tsdown、tsc 再复制
 */

import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile, copyFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
/** 技能脚本位于 .agents/skills/use-cat-kit/scripts，上溯四级到仓库根 */
const REPO_ROOT = join(__dirname, '../../../..')
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

function catKitInstallRoots(pkg: string): string[] {
  return [
    join(REPO_ROOT, 'node_modules', '@cat-kit', pkg),
    join(REPO_ROOT, 'packages', 'core', 'node_modules', '@cat-kit', pkg),
    join(REPO_ROOT, 'packages', 'pc', 'node_modules', '@cat-kit', pkg),
    join(REPO_ROOT, 'packages', 'styles', 'node_modules', '@cat-kit', pkg),
    join(REPO_ROOT, 'packages', 'cli', 'node_modules', '@cat-kit', pkg),
    join(REPO_ROOT, 'packages', 'directives', 'node_modules', '@cat-kit', pkg),
    join(REPO_ROOT, 'packages', pkg)
  ]
}

function resolveCatKitDist(pkg: string): string | null {
  for (const root of catKitInstallRoots(pkg)) {
    const dist = join(root, 'dist')
    if (existsSync(dist)) return dist
  }
  return null
}

function resolveCatKitPackageJson(pkg: string): string | null {
  for (const root of catKitInstallRoots(pkg)) {
    const pj = join(root, 'package.json')
    if (existsSync(pj)) return pj
  }
  return null
}

async function buildWithTsdown(): Promise<void> {
  const maintenanceBuild = join(
    REPO_ROOT,
    'packages',
    'maintenance',
    'src',
    'build',
    'build.ts'
  )
  if (!existsSync(maintenanceBuild)) {
    throw new Error(
      '[sync] --build 仅在 cat-kit 单仓可用（缺少 packages/maintenance）。在 ultra-ui 请依赖已安装的 node_modules 后执行不带 --build 的同步。'
    )
  }
  const { buildLib } = await import(maintenanceBuild)
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

async function mirrorPackageDist(pkg: string): Promise<{ count: number; distDir: string | null }> {
  const dist = resolveCatKitDist(pkg)
  if (!dist) {
    console.warn(`[sync] no dist for @cat-kit/${pkg}, skip copy`)
    return { count: 0, distDir: null }
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
  return { count: n, distDir: dist }
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
    const pkgJsonPath = resolveCatKitPackageJson(pkg)
    let npmName = `@cat-kit/${pkg}`
    let version = '0.0.0'
    if (pkgJsonPath) {
      const pj = await readJson(pkgJsonPath)
      if (pj.name) npmName = pj.name
      if (pj.version) version = pj.version
    }

    const { count, distDir } = await mirrorPackageDist(pkg)
    total += count
    manifest.packages[pkg] = {
      npmName,
      version,
      dtsFiles: count,
      distRelative: distDir ? relative(REPO_ROOT, distDir) : `(missing @cat-kit/${pkg}/dist)`
    }
  }

  await writeFile(join(OUT_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')

  await writeFile(
    join(OUT_ROOT, 'README.md'),
    `# generated — npm typings 镜像

本目录由脚本生成，**勿手改**。内容来自各包 typings：优先 \`node_modules/@cat-kit/<name>/dist\`，否则 \`packages/<name>/dist\`（cat-kit 单仓）。

- 生成：仓库根 \`bun run sync-use-cat-kit-api\`；cat-kit 单仓可加 \`-- --build\` 先本地构建再复制
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
