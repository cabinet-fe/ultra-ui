import { cp, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

import { readDir } from '@cat-kit/be'

import { UI_PATH } from '../shared'

const files = await readDir(resolve(UI_PATH, 'types'), {
  recursive: true,
  onlyFiles: true,
  filter: (entry) => entry.name.endsWith('.d.ts')
})

await Promise.all(
  files.map(async (filePath) => {
    const targetFilePath = filePath.replace(/\.d\.ts$/, '.ts')
    await cp(filePath, targetFilePath, { force: true })
    await rm(filePath)
  })
)
