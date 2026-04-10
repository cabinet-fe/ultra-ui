import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

import { readDir } from '@cat-kit/be'
import { checkbox } from '@inquirer/prompts'

import { UI_PATH } from '../shared'

const packages = await readDir(UI_PATH, { filter: (e) => e.isDirectory })

const packageNames = await checkbox({
  message: '导出哪些包?',
  choices: packages.map((p) => ({ name: p.name, value: p.name }))
})

/**
 *
 * @param targetPackage 目标包名
 * @param prefix 导出前缀
 * @returns
 */
async function getContent(targetPackage: string, prefix: string) {
  const dirs = await readDir(targetPackage, {
    filter(entry) {
      if (entry.isFile) {
        return entry.name !== 'index.ts' && entry.name.endsWith('.ts')
      }
      return !/(__test__|node_modules)/.test(entry.name)
    }
  })

  const contents = await Promise.all(
    dirs.map(async (dir) => {
      if (dir.isDirectory) {
        const existEntry = existsSync(join(dir.path, 'index.ts'))

        if (existEntry) {
          return `export * from '${prefix}${dir.name}'`
        }
        const childFiles = await readDir(dir.path, {
          onlyFiles: true,
          filter: (e) => e.name.endsWith('.ts')
        })
        return childFiles
          .map((childPath) => {
            const stem = basename(childPath, extname(childPath))
            return `export * from '${prefix}${dir.name}/${stem}'`
          })
          .join('\n\n')
      }

      const stem = basename(dir.path, extname(dir.path))
      return `export * from '${prefix}${stem}'`
    })
  )

  return contents.join('\n\n')
}

async function exportEntry() {
  await Promise.all(
    packageNames.map(async (pkg) => {
      const targetPackage = join(UI_PATH, pkg)
      await writeFile(
        join(targetPackage, 'index.ts'),
        await getContent(targetPackage, './'),
        'utf-8'
      )
    })
  )
}

exportEntry()
