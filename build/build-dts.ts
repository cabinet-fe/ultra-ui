import { DIST_ROOT } from './helper'
import fg from 'fast-glob'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { $ } from 'execa'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function buildDTS() {
  await $({
    cwd: resolve(__dirname, '../ui')
  })`vue-tsc --emitDeclarationOnly --declaration -p tsconfig.json`

  const files = await fg.glob('**/*.d.ts', {
    cwd: DIST_ROOT,
    absolute: true
  })
  files.forEach(async file => {
    const content = await readFile(file, 'utf-8')

    writeFile(
      file,
      content.replace(
        /@ui/g,
        relative(dirname(file), DIST_ROOT).replace(/\\/g, '/')
      )
    )
  })
}
