import fg from 'fast-glob'
import { dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const __dirname = dirname(fileURLToPath(import.meta.url))

export const UI_ROOT = resolve(__dirname, '../ui')

export const DIST_ROOT = resolve(__dirname, '../dist')

export async function getEntries() {
  const entries = await fg.glob('**/*.{ts,vue,tsx}', {
    cwd: UI_ROOT,
    ignore: ['**/node_modules', '**/__test__', 'types/**', '**/style.ts']
  })
  return Object.fromEntries(
    entries.map(entry => [
      entry.slice(0, -extname(entry).length),
      resolve(UI_ROOT, entry)
    ])
  )
}
