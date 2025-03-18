import { DIST_ROOT } from './helper'
import fg from 'fast-glob'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, relative } from 'node:path'
import { $ } from 'bun'

export async function buildDTS() {
  await $`bun vue-tsc --emitDeclarationOnly --declaration -p ../ui/tsconfig.json`

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
