#!/usr/bin/env bun

/**
 * 生成 `@veltra/vite` resolver 的组件表（packages/vite/src/components.gen.ts）。
 *
 * 组件目录的判定：扫描目录下同时含 `index.ts` 与 `style.ts` 的直接子目录，
 * 其 `index.ts` 中导出的 `U*` 值即该目录承载的组件，样式副作用取同目录 `style.ts`。
 *
 * 用法：
 *   bun run scripts/gen-vite-resolver.ts           # 重新生成
 *   bun run scripts/gen-vite-resolver.ts --check   # 校验是否为最新（CI 用，不落盘）
 */

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const REPO_ROOT = resolve(import.meta.dirname, '..')
const OUTPUT_FILE = join(REPO_ROOT, 'packages/vite/src/components.gen.ts')

interface ScanSource {
  /** 组件的导入来源包名 */
  from: string
  /** 包目录（相对仓库根） */
  pkgDir: string
  /** 组件目录的扫描根（相对包目录） */
  scanDir: string
}

const SOURCES: ScanSource[] = [
  { from: '@veltra/desktop', pkgDir: 'packages/desktop', scanDir: 'src/components' },
  { from: '@veltra/ai', pkgDir: 'packages/ai', scanDir: 'src/components' },
  { from: '@veltra/sheet', pkgDir: 'packages/sheet', scanDir: 'src/components' }
]

const EXPORT_BLOCK_RE = /export\s+(type\s+)?\{([^}]*)\}/g

/** 从 index.ts 源码中取出导出的 `U*` 组件名（跳过类型导出与非组件导出） */
function extractComponentNames(source: string): string[] {
  const names: string[] = []

  for (const [, typeOnly, specifiers] of source.matchAll(EXPORT_BLOCK_RE)) {
    if (typeOnly || !specifiers) continue

    for (const specifier of specifiers.split(',')) {
      const trimmed = specifier.trim()
      if (!trimmed || trimmed.startsWith('type ')) continue

      const exported = trimmed
        .split(/\s+as\s+/)
        .at(-1)!
        .trim()
      if (/^U[A-Z]/.test(exported)) names.push(exported)
    }
  }

  return names
}

async function readIfExists(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return undefined
  }
}

/** 扫描单个包，返回「组件名 → 样式子路径（相对包名）」 */
async function scanPackage(source: ScanSource): Promise<Map<string, string>> {
  const srcDir = join(REPO_ROOT, source.pkgDir, 'src')
  const scanRoot = join(REPO_ROOT, source.pkgDir, source.scanDir)
  const entries = await readdir(scanRoot, { withFileTypes: true })
  const components = new Map<string, string>()

  const scanned = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const dir = join(scanRoot, entry.name)
        const [index, style] = await Promise.all([
          readIfExists(join(dir, 'index.ts')),
          readIfExists(join(dir, 'style.ts'))
        ])

        if (index === undefined || style === undefined) return undefined

        const stylePath = `${relative(srcDir, dir).replaceAll('\\', '/')}/style`
        return { names: extractComponentNames(index), stylePath }
      })
  )

  for (const item of scanned) {
    if (!item) continue

    for (const name of item.names) {
      const existing = components.get(name)
      if (existing !== undefined) {
        throw new Error(
          `${source.from} 中组件 ${name} 被多个目录导出：${existing}、${item.stylePath}`
        )
      }
      components.set(name, item.stylePath)
    }
  }

  return components
}

function renderFile(packages: { from: string; components: Map<string, string> }[]): string {
  const blocks = packages.map(({ components, from }) => {
    const entries = [...components]
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([name, stylePath]) => `      ${name}: '${stylePath}'`)
      .join(',\n')

    return `  {\n    from: '${from}',\n    components: {\n${entries}\n    }\n  }`
  })

  return `// 由 \`bun run resolver:gen\`（scripts/gen-vite-resolver.ts）生成，请勿手动编辑。

export interface VeltraComponentPackage {
  /** 组件的导入来源包名 */
  from: string
  /** 组件名 → 样式副作用子路径（相对包名，无扩展名） */
  components: Record<string, string>
}

export const VELTRA_COMPONENT_PACKAGES: VeltraComponentPackage[] = [
${blocks.join(',\n')}
]
`
}

async function main(): Promise<void> {
  const check = process.argv.includes('--check')

  const packages = await Promise.all(
    SOURCES.map(async (source) => ({ from: source.from, components: await scanPackage(source) }))
  )

  const seen = new Map<string, string>()
  for (const { components, from } of packages) {
    for (const name of components.keys()) {
      const owner = seen.get(name)
      if (owner !== undefined) {
        throw new Error(`组件名 ${name} 在 ${owner} 与 ${from} 中重复，resolver 无法确定来源`)
      }
      seen.set(name, from)
    }
  }

  const previous = await readIfExists(OUTPUT_FILE)
  let next: string

  // Oxfmt 只认工作区内的配置，因此 --check 也在原地生成再还原，保证排版口径与 `vp fmt` 一致
  try {
    await writeFile(OUTPUT_FILE, renderFile(packages), 'utf8')

    const fmt = Bun.spawnSync(['vp', 'fmt', OUTPUT_FILE, '--write'], { cwd: REPO_ROOT })
    if (fmt.exitCode !== 0) {
      throw new Error(`vp fmt 失败：${fmt.stderr.toString()}`)
    }

    next = await readFile(OUTPUT_FILE, 'utf8')
  } finally {
    if (check && previous !== undefined) await writeFile(OUTPUT_FILE, previous, 'utf8')
  }

  if (check && next !== previous) {
    console.error('[gen-vite-resolver] 组件表已过期，请运行 `bun run resolver:gen` 后提交')
    process.exit(1)
  }

  console.log(
    `[gen-vite-resolver] ${check ? 'up to date' : 'generated'} components=${seen.size} ` +
      packages.map(({ components, from }) => `${from}=${components.size}`).join(' ')
  )
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[gen-vite-resolver] ${message}`)
  process.exit(1)
})
