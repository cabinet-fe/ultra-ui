import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { promptVersion, release, updateVersion, versionTargets } from './release'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const isRelease = process.argv.includes('--release')

function runRootBuild(): void {
  const r = spawnSync('bun', ['run', 'build'], { cwd: ROOT, stdio: 'inherit' })
  if (r.error) throw r.error
  if (r.status !== 0) process.exit(r.status ?? 1)
}

async function main(): Promise<void> {
  if (isRelease) {
    const version = await promptVersion()
    await updateVersion(version, versionTargets())
    runRootBuild()
    await release(version)
  } else {
    runRootBuild()
  }
}

void main()
