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
  const dirs = await readDir(join(PKG_PATH, packageName), {
    readType: 'dir'
  })

  let entryContent = ''
  dirs.forEach(dir => {
    const existEntry = existsSync(join(dir.path, 'index.ts'))
    if (existEntry) {
      entryContent += `export * from './${dir.name}'`
    }
  })

  writeFile(join(PKG_PATH, 'index.ts'), entryContent)
}

exportEntry()