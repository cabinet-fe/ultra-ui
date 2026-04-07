import { readDir } from 'cat-kit/be'
import { resolve } from 'path'
import { UI_PATH } from '../shared'
import { cp, rm } from 'fs/promises'

readDir(resolve(UI_PATH, 'types'), {
  recursive: true,
  async callback(dir) {
    if (dir.type === 'file') {
      if (!/\.d\.ts$/.test(dir.path)) return
      const targetFilePath = dir.path.replace(/\.d\.ts$/, '.ts')
      await cp(dir.path, targetFilePath, {
        force: true
      })
      rm(dir.path)
    }
  }
})
