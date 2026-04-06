import { resolve } from 'node:path'
import { build } from './build'
import { copyFiles, genFiles, writeDistPackageJson } from './prepare'
import { release, promptVersion, updateVersion } from './release'
import { PUBLISH_PACKAGES } from './shared'

const isRelease = process.argv.includes('--release')
const dryRun = process.argv.includes('--dry-run')

async function boot(isRelease: boolean) {
  let version: string | undefined

  if (isRelease) {
    version = await promptVersion()
    await updateVersion(
      version,
      PUBLISH_PACKAGES.map(({ root }) => resolve(root, 'package.json'))
    )
  }

  await build()
  await writeDistPackageJson()
  await copyFiles()
  await genFiles()

  if (isRelease && version) {
    await release(version, { dryRun })
  }
}

boot(isRelease)
