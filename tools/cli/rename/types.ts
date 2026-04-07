import { readDir } from '@cat-kit/be'
import { resolve } from 'node:path'
import { UI_PATH } from '../shared'
import { cp, rm } from 'node:fs/promises'

const files = await readDir(resolve(UI_PATH, 'types'), {
  recursive: true,
  onlyFiles: true,
  filter: entry => entry.name.endsWith('.d.ts')
})

for (const filePath of files) {
  const targetFilePath = filePath.replace(/\.d\.ts$/, '.ts')
  await cp(filePath, targetFilePath, {
    force: true
  })
  await rm(filePath)
}
