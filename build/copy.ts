import { cp } from 'fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))

async function copy(copies: [string, string][]) {
  Promise.all(
    copies.map(([f, t]) => {
      return cp(resolve(__dirname, f), resolve(__dirname, t))
    })
  )
}

export function copyFiles() {
  return copy([['../README.md', '../dist/README.md']])
}
