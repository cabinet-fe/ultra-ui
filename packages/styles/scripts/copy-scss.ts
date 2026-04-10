import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcRoot = join(pkgRoot, 'src')
const distRoot = join(pkgRoot, 'dist')

async function walkScss(dir: string): Promise<string[]> {
  const out: string[] = []
  for (const name of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, name.name)
    if (name.isDirectory()) out.push(...(await walkScss(p)))
    else if (name.name.endsWith('.scss')) out.push(p)
  }
  return out
}

for (const abs of await walkScss(srcRoot)) {
  const rel = relative(srcRoot, abs)
  const dest = join(distRoot, rel)
  await mkdir(dirname(dest), { recursive: true })
  await copyFile(abs, dest)
}
