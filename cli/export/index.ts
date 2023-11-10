import { readDir } from 'cat-kit/be'
import { PKG_PATH } from '../shared'
import inquirer from 'inquirer'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'

const packages = await readDir(PKG_PATH, {
  readType: 'dir'
})

const { packageName } = await inquirer.prompt<{
  packageName: string
}>([
  {
    message: '导出哪个包?',
    type: 'list',
    choices: packages,
    name: 'packageName'
  }
])

async function exportEntry() {
  const targetPackage = join(PKG_PATH, packageName)
  const dirs = await readDir(targetPackage, {
    readType: 'dir'
  })

  const entryContent = await Promise.all(
    dirs.map(async dir => {
      const existEntry = existsSync(join(dir.path, 'index.ts'))

      if (existEntry) {
        return `export * from './${dir.name}'`
      } else {
        const childDirs = await readDir(dir.path, {
          readType: 'file'
        })
        return childDirs
          .map(childDir => `export * from './${dir.name}/${childDir.name.replace(childDir.ext, '')}'`)
          .join('\n\n')
      }
    })
  )

  writeFile(join(targetPackage, 'index.ts'), entryContent.join('\n\n'), 'utf-8')
}

exportEntry()
