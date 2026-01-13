import { build } from './build'
import { buildStyles } from './build-styles'
import { copyFiles } from './copy'

await build()
await buildStyles()
await copyFiles()