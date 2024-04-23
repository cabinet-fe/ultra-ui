import { cp } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const excludeFiles = new Set(['index.ts'])

/**
 * 拷贝@ui/types文件夹
 */
export async function copyStyles() {
  /** 拷贝公用样式 */
  cp(
    resolve(__dirname, '../ui/styles'),
    resolve(__dirname, '../dist/styles'),
    {
      recursive: true,
      filter: src => {
        return excludeFiles.has(basename(src)) ? false : true
      }
    }
  )

  /** 拷贝组件样式 */
  // cp(resolve(__dirname, '../ui/components/'))
}
