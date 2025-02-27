import { buildStyles } from './build-styles'
import { copyFiles } from './copy'
import { build } from './build'
import { buildDTS } from './build-dts'
import { genPackageJson } from './gen-package-json'
import { genInstall } from './gen-install'
import { $ } from 'bun'

async function boot() {
  await genInstall()
  await build()
  await buildDTS()
  await buildStyles()
  await copyFiles()
  await genPackageJson()
  try {
    await $`cd ../dist && pnpm publish --registry http://192.168.31.250:6005 --no-git-checks`
  } catch (error: any) {
    console.error(error.stderr?.toString())
  }
}

boot()
