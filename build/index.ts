import { buildStyles } from './build-styles'
import { copyFiles } from './copy'
import { build } from './build'
import { buildDTS } from './build-dts'
import { genPackageJson } from './gen-package-json'
import { $ } from 'bun'

async function boot() {
  await build()
  await buildDTS()
  await buildStyles()
  await copyFiles()
  await genPackageJson()
  try {
    await $`cd ../dist && npm publish --registry http://192.168.31.250:6005`
  } catch (error: any) {
    console.error(error.stderr?.toString())
  }
}

boot()
