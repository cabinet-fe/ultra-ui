import { buildStyles } from './build-styles'
import { copyFiles } from './copy'
import { build } from './build'
import { buildDTS } from './build-dts'
import { genPackageJson } from './gen-package-json'
import { genInstall } from './gen-install'
import { $ } from 'execa'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function boot() {
  await genInstall()
  await build()
  await buildDTS()
  await buildStyles()
  await copyFiles()
  await genPackageJson()
  try {
    await $({
      cwd: resolve(__dirname, '../dist')
    })`npm publish --registry http://192.168.31.250:6005`
    console.log('发布成功')
  } catch (error: any) {
    console.error(error.stderr?.toString())
  }
}

boot()
