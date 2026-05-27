#!/usr/bin/env bun

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const PACKAGES_DIR = join(REPO_ROOT, 'packages')
const INTERNAL_SCOPE = '@veltra/'
const DRY_RUN = process.env.DRY_RUN === '1'
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
  exports?: unknown
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  [key: string]: unknown
}

type PackageFile = { path: string; relativePath: string; json: PackageJson }

function isInternalPackage(name: string | undefined): name is string {
  return typeof name === 'string' && name.startsWith(INTERNAL_SCOPE)
}

async function listPackageFiles(): Promise<PackageFile[]> {
  const entries = await readdir(PACKAGES_DIR, { withFileTypes: true })
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const relativePath = join('packages', entry.name, 'package.json')
        const path = join(REPO_ROOT, relativePath)
        const raw = await readFile(path, 'utf8')

        return { path, relativePath, json: JSON.parse(raw) as PackageJson }
      })
  )

  return files.toSorted((a, b) => a.relativePath.localeCompare(b.relativePath))
}

function buildWorkspaceVersionMap(files: readonly PackageFile[]): Map<string, string> {
  const versionMap = new Map<string, string>()

  for (const file of files) {
    const { name, version } = file.json

    if (isInternalPackage(name) && version) {
      versionMap.set(name, version)
    }
  }

  return versionMap
}

function resolveWorkspaceRange(spec: string, version: string): string {
  const raw = spec.slice('workspace:'.length)

  if (raw === '' || raw === '*') {
    return version
  }

  if (raw === '^' || raw === '~') {
    return `${raw}${version}`
  }

  return raw
}

const INTERNAL_EXPORT_CONDITIONS = ['development', 'veltra-dev'] as const

function stripInternalExportConditions(node: unknown): boolean {
  if (node === null || typeof node !== 'object') {
    return false
  }

  if (Array.isArray(node)) {
    let changed = false

    for (const item of node) {
      changed = stripInternalExportConditions(item) || changed
    }

    return changed
  }

  const object = node as Record<string, unknown>
  let changed = false

  for (const condition of INTERNAL_EXPORT_CONDITIONS) {
    if (Object.hasOwn(object, condition)) {
      delete object[condition]
      changed = true
    }
  }

  for (const value of Object.values(object)) {
    changed = stripInternalExportConditions(value) || changed
  }

  return changed
}

function rewriteDependencyField(
  packageName: string,
  field: DependencyField,
  deps: Record<string, string> | undefined,
  versionMap: ReadonlyMap<string, string>
): string[] {
  if (!deps) {
    return []
  }

  const changes: string[] = []

  for (const [name, spec] of Object.entries(deps)) {
    if (!spec.startsWith('workspace:')) {
      continue
    }

    const version = versionMap.get(name)

    if (!version) {
      throw new Error(`${packageName} 的 ${field}.${name} 使用了 ${spec}，但未找到内部包版本`)
    }

    const nextSpec = resolveWorkspaceRange(spec, version)

    if (nextSpec === spec) {
      continue
    }

    deps[name] = nextSpec
    changes.push(`${name}: ${spec} -> ${nextSpec}`)
  }

  return changes
}

function assertNoWorkspaceRanges(
  packageName: string,
  field: DependencyField,
  deps: Record<string, string> | undefined
): void {
  if (!deps) {
    return
  }

  for (const [name, spec] of Object.entries(deps)) {
    if (spec.startsWith('workspace:')) {
      throw new Error(`${packageName} 的 ${field}.${name} 仍残留未解析的 workspace 协议`)
    }
  }
}

async function main(): Promise<void> {
  const files = await listPackageFiles()
  const versionMap = buildWorkspaceVersionMap(files)
  const writes: Array<Promise<void>> = []
  let rewrittenFiles = 0

  for (const file of files) {
    const { json } = file

    if (!isInternalPackage(json.name) || json.private === true) {
      continue
    }

    const changesByField: string[] = []

    if (json.exports !== undefined && stripInternalExportConditions(json.exports)) {
      changesByField.push('exports: removed internal development conditions')
    }

    for (const field of DEPENDENCY_FIELDS) {
      const changes = rewriteDependencyField(json.name, field, json[field], versionMap)

      if (changes.length > 0) {
        changesByField.push(`${field}: ${changes.join(', ')}`)
      }
    }

    for (const field of DEPENDENCY_FIELDS) {
      assertNoWorkspaceRanges(json.name, field, json[field])
    }

    if (changesByField.length === 0) {
      continue
    }

    rewrittenFiles += 1
    console.log(`[normalize-release-manifests] ${file.relativePath}`)

    for (const change of changesByField) {
      console.log(`  - ${change}`)
    }

    if (!DRY_RUN) {
      writes.push(writeFile(file.path, `${JSON.stringify(json, null, 2)}\n`, 'utf8'))
    }
  }

  await Promise.all(writes)

  if (rewrittenFiles === 0) {
    console.log('[normalize-release-manifests] no publishable package needed rewriting')
    return
  }

  const suffix = DRY_RUN ? ' (dry-run)' : ''
  console.log(`[normalize-release-manifests] processed ${rewrittenFiles} package(s)${suffix}`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[normalize-release-manifests] ${message}`)
  process.exit(1)
})
