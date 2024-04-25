import { cp } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const excludeFiles = new Set<string>([])

/**
 * 拷贝@ui/types文件夹
 */
export async function copyTypes() {
  await cp(
    resolve(__dirname, '../ui/types'),
    resolve(__dirname, '../dist/types'),
    {
      recursive: true,
      filter: src => {
        return excludeFiles.has(basename(src)) ? false : true
      }
    }
  )
}
