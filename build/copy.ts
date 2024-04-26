import { cp } from 'fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))

function copy(copies: [string, string][]) {
  copies.forEach(([f, t]) => {
    cp(resolve(__dirname, f), resolve(__dirname, t))
  })
}

export function copyFiles() {
  copy([
    ['../README.md', '../dist/README.md'],
    ['../vite-helper/resolver.js', '../dist/resolver.js'],
    ['../vite-helper/resolver.d.ts', '../dist/resolver.d.ts']
  ])
}
