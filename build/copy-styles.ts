import { cp } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const excludeFiles = new Set(['package.json', 'tsconfig.json'])

/**
 * 拷贝@ui/types文件夹
 */
export async function copyStyles() {
  await cp(
    resolve(__dirname, '../ui-packages/styles'),
    resolve(__dirname, '../dist/ui-packages/styles'),
    {
      recursive: true,
      filter: src => {
        return excludeFiles.has(basename(src)) ? false : true
      }
    }
  )
}
