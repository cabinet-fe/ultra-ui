// 扫描 src/svg 下全部 .svg，输出 basename 建议名；`--apply` 时 git mv。
import { spawnSync } from 'node:child_process'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import fg from 'fast-glob'

import { suggestBasename } from './icon-naming'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = join(__dirname, '..')
const SVG_GLOB = 'src/svg/**/*.svg'
const apply = process.argv.includes('--apply')

const paths = await fg(SVG_GLOB, { cwd: PKG_ROOT, absolute: true }).then((p) => p.sort())

type Row = { rel: string; fromBase: string; toBase: string; dir: string }

const rows: Row[] = []
for (const abs of paths) {
  const rel = relative(PKG_ROOT, abs).replaceAll('\\', '/')
  const base = rel.split('/').pop()!
  const fromBase = base.replace(/\.svg$/i, '')
  const toBase = suggestBasename(fromBase)
  const dir = dirname(rel)
  rows.push({ rel, fromBase, toBase, dir })
}

const renames = rows.filter((r) => r.fromBase !== r.toBase)

/** 应用重命名后的完整相对路径 → 来源 rel（用于冲突检测） */
const targetToSources = new Map<string, string[]>()
for (const r of rows) {
  const finalBase = r.fromBase === r.toBase ? r.fromBase : r.toBase
  const target = `${r.dir}/${finalBase}.svg`
  const list = targetToSources.get(target) ?? []
  list.push(r.rel)
  targetToSources.set(target, list)
}

const conflicts: { target: string; sources: string[] }[] = []
for (const [target, sources] of targetToSources) {
  if (sources.length > 1) {
    conflicts.push({ target, sources })
  }
}

console.log(JSON.stringify({ renames, conflicts, total: paths.length }, null, 2))

if (conflicts.length > 0) {
  console.error(
    '\n重名冲突：合并后多个文件指向同一路径，请人工裁定后缀（如 -outline）后更新命名脚本或文件名。'
  )
  process.exit(1)
}

if (!apply) {
  if (renames.length === 0) {
    console.log('无需重命名。')
  } else {
    console.log('\n使用 --apply 执行 git mv。')
  }
  process.exit(0)
}

for (const r of renames) {
  const fromPath = join(PKG_ROOT, r.dir, `${r.fromBase}.svg`)
  const toPath = join(PKG_ROOT, r.dir, `${r.toBase}.svg`)
  const res = spawnSync('git', ['mv', '-f', fromPath, toPath], {
    stdio: 'inherit',
    cwd: join(PKG_ROOT, '../..')
  })
  if (res.status !== 0) {
    console.error(`git mv 失败: ${r.dir}/${r.fromBase}.svg -> ${r.toBase}.svg`)
    process.exit(res.status ?? 1)
  }
}

console.log(`已重命名 ${renames.length} 个文件。`)
