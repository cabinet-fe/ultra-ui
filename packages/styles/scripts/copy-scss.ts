import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcRoot = join(pkgRoot, 'src')
const distRoot = join(pkgRoot, 'dist')

async function walkScss(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (name) => {
      const p = join(dir, name.name)
      if (name.isDirectory()) return walkScss(p)
      if (name.name.endsWith('.scss')) return [p]
      return []
    })
  )
  return nested.flat()
}

const scssFiles = await walkScss(srcRoot)
await Promise.all(
  scssFiles.map(async (abs) => {
    const rel = relative(srcRoot, abs)
    const dest = join(distRoot, rel)
    await mkdir(dirname(dest), { recursive: true })
    await copyFile(abs, dest)
  })
)
