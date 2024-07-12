import { execa } from 'execa'
import { DIST_ROOT } from './helper'
import fg from 'fast-glob'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'

export async function buildDTS() {
  await execa(
    'vue-tsc',
    ['--emitDeclarationOnly', '--declaration', '-p', '../ui/tsconfig.json'],
    {
      stdio: 'inherit'
    }
  )

  const files = await fg.glob('**/*.d.ts', {
    cwd: DIST_ROOT
  })
  files.forEach(async file => {
    const absPath = resolve(DIST_ROOT, file)
    const content = await readFile(absPath, 'utf-8')
    writeFile(
      absPath,
      content.replace(
        '@ui',
        relative(dirname(absPath), DIST_ROOT).replace(/\\/g, '/')
      )
    )
  })
}
