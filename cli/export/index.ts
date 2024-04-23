import { readDir } from 'cat-kit/be'
import { UI_PATH } from '../shared'
import inquirer from 'inquirer'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'

const packages = await readDir(UI_PATH, {
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

/**
 *
 * @param targetPackage 目标包名
 * @param prefix 导出前缀
 * @returns
 */
async function getContent(targetPackage: string, prefix: string) {
  const dirs = await readDir(targetPackage, {
    filter(dirent) {
      if (dirent.isFile()) {
        return dirent.name !== 'index.ts' && /\.ts$/.test(dirent.name)
      } else {
        return !/(__test__|node_modules)/.test(dirent.name)
      }
    }
  })

  const contents = await Promise.all(
    dirs.map(async dir => {
      if (dir.type === 'dir') {
        const existEntry = existsSync(join(dir.path, 'index.ts'))

        if (existEntry) {
          return `export * from '${prefix}${dir.name}'`
        } else {
          const childDirs = await readDir(dir.path, {
            readType: 'file'
          })
          return childDirs
            .map(
              childDir =>
                `export * from '${prefix}${dir.name}/${childDir.name.replace(
                  childDir.ext,
                  ''
                )}'`
            )
            .join('\n\n')
        }
      }

      return `export * from '${prefix}${dir.name.replace(dir.ext, '')}'`
    })
  )

  return contents.join('\n\n')
}

async function exportEntry() {
  const targetPackage = join(UI_PATH, packageName)

  writeFile(
    join(targetPackage, 'index.ts'),
    await getContent(targetPackage, './'),
    'utf-8'
  )
  writeFile(
    join(UI_PATH, packageName + '.ts'),
    await getContent(targetPackage, `@ui/${packageName}/`),
    'utf-8'
  )
}

exportEntry()
