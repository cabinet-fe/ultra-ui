#!/usr/bin/env bun
import { writeFileSync } from 'node:fs'
// 根据 src/vue 下的 .vue 生成具名导出入口：src/normal.ts、src/colorful.ts
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { kebabBasenameToComponentName } from './icon-naming'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = join(__dirname, '..')

const BANNER =
  '/**\n * 代码生成：bun run icons:gen（gen-icon-barrels.ts）\n * 勿手改；增删图标后重新执行 icons:gen。\n */\n'

function buildBarrel(sub: 'normal' | 'colorful'): string {
  const matcher = new Bun.Glob(`src/vue/${sub}/*.vue`)
  const files: string[] = []
  for (const rel of matcher.scanSync({ cwd: PKG_ROOT })) {
    files.push(join(PKG_ROOT, rel))
  }
  files.sort()
  const rows: { exportName: string; base: string }[] = []
  for (const abs of files) {
    const base = basename(abs, '.vue')
    rows.push({ exportName: kebabBasenameToComponentName(base), base })
  }
  rows.sort((a, b) => a.exportName.localeCompare(b.exportName))
  const lines = rows.map(
    (r) => `export { default as ${r.exportName} } from './vue/${sub}/${r.base}.vue'`
  )
  return BANNER + lines.join('\n') + '\n'
}

export function writeIconBarrelSources(root: string = PKG_ROOT): void {
  writeFileSync(join(root, 'src/normal.ts'), buildBarrel('normal'), 'utf8')
  writeFileSync(join(root, 'src/colorful.ts'), buildBarrel('colorful'), 'utf8')
}

writeIconBarrelSources(PKG_ROOT)
console.log('icon barrels: src/normal.ts, src/colorful.ts')
