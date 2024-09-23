import { buildStyles } from './build-styles'
import { copyFiles } from './copy'
import { build } from './build'
import { buildDTS } from './build-dts'

console.log(process.env.HOMEPATH)

async function boot() {
  await build()

  await buildDTS()

  await buildStyles()

  copyFiles()
}

boot()
