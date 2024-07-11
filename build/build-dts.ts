import { execa } from 'execa'
import { DIST_ROOT } from './helper'
import fg from 'fast-glob'

export async function buildDTS() {
  await execa(
    'vue-tsc',
    ['--emitDeclarationOnly', '--declaration', '-p', '../ui/tsconfig.json'],
    {
      stdio: 'inherit'
    }
  )

  const files = await fg.glob('../dist/**/*.d.ts')
}
