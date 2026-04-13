import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

type DependencyField = 'dependencies' | 'peerDependencies' | 'optionalDependencies'

type PackageJson = {
  name?: string
  version?: string
  private?: boolean
  exports?: unknown
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

type Manifest = { path: string; raw: string; packageJson: PackageJson }

const ROOT_PATH = fileURLToPath(new URL('../../../', import.meta.url))
const PACKAGES_PATH = join(ROOT_PATH, 'packages')
const INTERNAL_SCOPE = '@veltra/'
const DEPENDENCY_FIELDS: DependencyField[] = [
  'dependencies',
  'peerDependencies',
  'optionalDependencies'
]

function isInternalPackage(name: string | undefined): name is string {
  return typeof name === 'string' && name.startsWith(INTERNAL_SCOPE)
}

function resolveWorkspaceRange(range: string, version: string) {
  switch (range) {
    case 'workspace:*':
      return version
    case 'workspace:^':
      return `^${version}`
    case 'workspace:~':
      return `~${version}`
    default:
      throw new Error(`暂不支持的 workspace 协议: ${range}`)
  }
}

/** 发布 tarball 不应携带 Node `development` 条件，否则宿主 Vite 等会优先指向源码路径，易与 unplugin-vue-components 等解析链路冲突。 */
function stripDevelopmentExportConditions(node: unknown): boolean {
  if (node === null || typeof node !== 'object') {
    return false
  }

  if (Array.isArray(node)) {
    let changed = false

    for (const item of node) {
      if (stripDevelopmentExportConditions(item)) {
        changed = true
      }
    }

    return changed
  }

  const obj = node as Record<string, unknown>
  let changed = false

  if (Object.hasOwn(obj, 'development')) {
    delete obj.development
    changed = true
  }

  for (const value of Object.values(obj)) {
    if (stripDevelopmentExportConditions(value)) {
      changed = true
    }
  }

  return changed
}

async function loadPackageManifests() {
  const entries = await readdir(PACKAGES_PATH, { withFileTypes: true })
  const packageJsonPaths = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(PACKAGES_PATH, entry.name, 'package.json'))

  return Promise.all(
    packageJsonPaths.map(async (path) => {
      const raw = await readFile(path, 'utf8')

      return { path, raw, packageJson: JSON.parse(raw) as PackageJson } satisfies Manifest
    })
  )
}

function createVersionMap(manifests: Manifest[]) {
  const versionMap = new Map<string, string>()

  for (const manifest of manifests) {
    const { name, version } = manifest.packageJson

    if (!isInternalPackage(name) || !version) {
      continue
    }

    versionMap.set(name, version)
  }

  return versionMap
}

function rewriteManifest(manifest: Manifest, versionMap: Map<string, string>) {
  const { packageJson } = manifest

  if (!isInternalPackage(packageJson.name) || packageJson.private) {
    return null
  }

  let changed = false

  if (packageJson.exports !== undefined && stripDevelopmentExportConditions(packageJson.exports)) {
    changed = true
  }

  for (const field of DEPENDENCY_FIELDS) {
    const deps = packageJson[field]

    if (!deps) {
      continue
    }

    for (const [name, range] of Object.entries(deps)) {
      if (!range.startsWith('workspace:')) {
        continue
      }

      const version = versionMap.get(name)

      if (!version) {
        throw new Error(
          `${packageJson.name} 的 ${field}.${name} 使用了 ${range}，但未找到可发布版本`
        )
      }

      deps[name] = resolveWorkspaceRange(range, version)
      changed = true
    }
  }

  for (const field of DEPENDENCY_FIELDS) {
    const deps = packageJson[field]

    if (!deps) {
      continue
    }

    for (const [name, range] of Object.entries(deps)) {
      if (range.startsWith('workspace:')) {
        throw new Error(`${packageJson.name} 的 ${field}.${name} 仍残留未解析的 workspace 协议`)
      }
    }
  }

  if (!changed) {
    return null
  }

  return `${JSON.stringify(packageJson, null, 2)}\n`
}

async function restoreManifests(manifests: Manifest[]) {
  await Promise.all(manifests.map((manifest) => writeFile(manifest.path, manifest.raw, 'utf8')))
}

async function main() {
  const command = Bun.argv.slice(2)
  const publishCommand = command.length > 0 ? command : ['changeset', 'publish']
  const manifests = await loadPackageManifests()
  const versionMap = createVersionMap(manifests)
  const rewrittenManifests: Manifest[] = []

  try {
    for (const manifest of manifests) {
      const nextContent = rewriteManifest(manifest, versionMap)

      if (!nextContent) {
        continue
      }

      await writeFile(manifest.path, nextContent, 'utf8')
      rewrittenManifests.push(manifest)
    }

    if (rewrittenManifests.length > 0) {
      console.log(
        `已为发布临时改写 package.json（workspace 依赖与/或 exports）: ${rewrittenManifests
          .map((manifest) => manifest.packageJson.name)
          .join(', ')}`
      )
    } else {
      console.log('未发现需要为发布临时改写的内部包清单')
    }

    const subprocess = Bun.spawn(publishCommand, {
      cwd: ROOT_PATH,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
      env: process.env
    })

    const exitCode = await subprocess.exited

    if (exitCode !== 0) {
      throw new Error(`发布命令失败，退出码 ${exitCode}`)
    }
  } finally {
    await restoreManifests(rewrittenManifests)
  }
}

await main()
