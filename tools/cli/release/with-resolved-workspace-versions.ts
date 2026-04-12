import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

type DependencyField = 'dependencies' | 'peerDependencies' | 'optionalDependencies'

type PackageJson = {
  name?: string
  version?: string
  private?: boolean
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
        `已为发布临时展开内部依赖版本: ${rewrittenManifests
          .map((manifest) => manifest.packageJson.name)
          .join(', ')}`
      )
    } else {
      console.log('未发现需要展开的内部 workspace 依赖')
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
