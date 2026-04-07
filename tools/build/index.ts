import { resolve } from 'node:path'
import { build } from './build'
import { buildStyles } from './build-styles'
import { copyFiles, genFiles } from './prepare'
import { release, promptVersion, updateVersion } from './release'
import { UI_ROOT } from './shared'

const isRelease = process.argv.includes('--release')

async function boot(isRelease: boolean) {
  let version: string | undefined

  if (isRelease) {
    version = await promptVersion()
    await updateVersion(version, [resolve(UI_ROOT, 'package.json')])
  }

  await build()
  await buildStyles()
  await copyFiles()
  await genFiles()

  if (isRelease && version) {
    await release(version)
  }
}

boot(isRelease)
