#!/usr/bin/env bun

import { spawnSync } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const PACKAGES_DIR = join(REPO_ROOT, 'packages')
const INTERNAL_SCOPE = '@veltra/'
const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies'
] as const

type DependencyField = (typeof DEPENDENCY_FIELDS)[number]

type PackageJson = {
  name?: string
  version?: string
  private?: boolean
  files?: unknown
  exports?: unknown
  main?: unknown
  module?: unknown
  types?: unknown
  bin?: unknown
} & { [K in DependencyField]?: Record<string, string> }

type PackageEntry = { name: string; directory: string; json: PackageJson }

type Tarball = { manifest: PackageJson; entries: Set<string>; fileCount: number }

type RunResult = { code: number; stdout: string; stderr: string }

function run(cmd: string, args: readonly string[], cwd: string): RunResult {
  const result = spawnSync(cmd, args as string[], { cwd, encoding: 'utf8' })

  return {
    code: result.status ?? -1,
    stdout: typeof result.stdout === 'string' ? result.stdout : '',
    stderr: typeof result.stderr === 'string' ? result.stderr : ''
  }
}

async function listPublishablePackages(): Promise<PackageEntry[]> {
  const entries = await readdir(PACKAGES_DIR, { withFileTypes: true })
  const packages = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const directory = join(PACKAGES_DIR, entry.name)
        const json = JSON.parse(
          await readFile(join(directory, 'package.json'), 'utf8')
        ) as PackageJson

        return json.name?.startsWith(INTERNAL_SCOPE) && json.private !== true
          ? { name: json.name, directory, json }
          : null
      })
  )

  return packages
    .filter((entry): entry is PackageEntry => entry !== null)
    .toSorted((a, b) => a.name.localeCompare(b.name))
}

async function packToTarball(entry: PackageEntry, destination: string): Promise<string> {
  const pack = run(process.execPath, ['pm', 'pack', '--destination', destination], entry.directory)

  if (pack.code !== 0) {
    throw new Error(`bun pm pack 失败（退出码 ${pack.code}）：\n${pack.stderr.trim()}`)
  }

  const tarballs = (await readdir(destination)).filter((file) => file.endsWith('.tgz'))

  if (tarballs.length !== 1) {
    throw new Error(`期望打包出 1 个 tarball，实际 ${tarballs.length} 个: ${tarballs.join(', ')}`)
  }

  return join(destination, tarballs[0]!)
}

function readTarball(tarballPath: string, cwd: string): Tarball {
  const list = run('tar', ['-tzf', tarballPath], cwd)

  if (list.code !== 0) {
    throw new Error(`tar -tzf 失败: ${list.stderr.trim()}`)
  }

  const entries = new Set(
    list.stdout
      .split(/\r?\n/)
      .filter((line) => line !== '')
      .map((line) => line.replace(/\/$/, ''))
  )
  const manifestRaw = run('tar', ['-xzOf', tarballPath, 'package/package.json'], cwd)

  if (manifestRaw.code !== 0) {
    throw new Error(`读取 tarball 内 package.json 失败: ${manifestRaw.stderr.trim()}`)
  }

  return {
    manifest: JSON.parse(manifestRaw.stdout) as PackageJson,
    entries,
    fileCount: entries.size
  }
}

function collectExportTargets(node: unknown, targets: string[]): void {
  if (node === null || typeof node !== 'object') {
    return
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      collectExportTargets(item, targets)
    }

    return
  }

  for (const value of Object.values(node)) {
    if (typeof value === 'string' && value.startsWith('./')) {
      targets.push(value)
    } else {
      collectExportTargets(value, targets)
    }
  }
}

function collectFieldTargets(manifest: PackageJson): string[] {
  const targets: string[] = []

  for (const field of ['main', 'module', 'types'] as const) {
    const value = manifest[field]

    if (typeof value === 'string') {
      targets.push(value)
    }
  }

  if (typeof manifest.bin === 'string') {
    targets.push(manifest.bin)
  } else if (manifest.bin !== null && typeof manifest.bin === 'object') {
    for (const value of Object.values(manifest.bin)) {
      if (typeof value === 'string') {
        targets.push(value)
      }
    }
  }

  collectExportTargets(manifest.exports, targets)

  return [...new Set(targets)]
}

function checkTarball(tarball: Tarball): string[] {
  const { manifest, entries } = tarball
  const errors: string[] = []

  for (const target of collectFieldTargets(manifest).toSorted()) {
    if (!target.startsWith('./') || target.includes('*')) {
      continue
    }

    if (!entries.has(`package/${target.slice(2)}`)) {
      errors.push(`入口 ${target} 不在 tarball 中（对应的构建产物缺失？）`)
    }
  }

  if (Array.isArray(manifest.files)) {
    for (const declared of manifest.files) {
      if (typeof declared !== 'string' || declared.includes('*')) {
        continue
      }

      const prefix = `package/${declared}`
      const present = [...entries].some((file) => file === prefix || file.startsWith(`${prefix}/`))

      if (!present) {
        errors.push(`files 声明的 ${declared} 未打进 tarball（对应的构建产物缺失？）`)
      }
    }
  }

  for (const field of DEPENDENCY_FIELDS) {
    for (const [name, spec] of Object.entries(manifest[field] ?? {})) {
      if (spec.startsWith('workspace:') || spec.startsWith('catalog')) {
        errors.push(`${field}.${name} 残留未解析的 ${spec}`)
      }
    }
  }

  for (const file of entries) {
    const base = file.split('/').pop() ?? ''

    if (base.startsWith('.env') || base === '.npmrc') {
      errors.push(`tarball 含敏感文件 ${file}`)
    }
  }

  return errors
}

type PackageResult = { errors: string[]; fileCount: number | null }

async function verifyPackage(entry: PackageEntry): Promise<PackageResult> {
  const tempDir = await mkdtemp(join(tmpdir(), 'veltra-tarball-'))

  try {
    const tarballPath = await packToTarball(entry, tempDir)
    const tarball = readTarball(tarballPath, entry.directory)

    return { errors: checkTarball(tarball), fileCount: tarball.fileCount }
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : String(error)], fileCount: null }
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

async function main(): Promise<void> {
  const packages = await listPublishablePackages()

  if (packages.length === 0) {
    console.error('[verify-release-tarballs] 未发现可发布的 @veltra/* 包')
    process.exit(1)
  }

  const results = await Promise.all(
    packages.map(async (entry) => ({ entry, result: await verifyPackage(entry) }))
  )
  let failures = 0

  for (const { entry, result } of results) {
    const version = entry.json.version ?? '?'

    if (result.errors.length > 0) {
      failures += 1
      console.error(`✖ ${entry.name}@${version}`)
      console.error(`  - ${result.errors.join('\n  - ')}`)
    } else {
      console.log(`✔ ${entry.name}@${version}（${result.fileCount} 个文件）`)
    }
  }

  if (failures > 0) {
    console.error(`[verify-release-tarballs] ${failures}/${packages.length} 个包校验失败`)
    process.exit(1)
  }

  console.log(`[verify-release-tarballs] ${packages.length} 个包全部通过`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[verify-release-tarballs] ${message}`)
  process.exit(1)
})
