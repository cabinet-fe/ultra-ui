#!/usr/bin/env bun

/**
 * 校验组件样式跟随约定：凡同时含 `style.ts` 的组件目录，
 * 其一级 `.vue` 文件必须在 script 首部 `import './style'`——
 * 样式经 ESM sideEffects 挂在组件模块自身，tree-shake 与组件同粒度，
 * 宿主显式导入组件即可，无需 resolver / 手动引样式。
 *
 * 用法：bun run style:check（接入 ci:verify）
 */

import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'

const REPO_ROOT = resolve(import.meta.dirname, '..')

const PACKAGES = ['desktop', 'ai', 'sheet', 'mobile'] as const

const STYLE_IMPORT_RE = /import\s+['"]\.\/style(\.ts)?['"]/

interface ComponentDir {
  dir: string
  /** 目录下一级 .vue 文件（含文件名） */
  sfcs: string[]
}

/** 收集含 `style.ts` 的组件目录及其一级 .vue 文件 */
async function collectComponentDirs(root: string): Promise<ComponentDir[]> {
  const entries = await readdir(root, { withFileTypes: true })
  const groups = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const dir = join(root, entry.name)
        const [nested, files, hasStyle] = await Promise.all([
          collectComponentDirs(dir),
          readdir(dir),
          readFile(join(dir, 'style.ts'), 'utf8').then(
            () => true,
            () => false
          )
        ])
        const sfcs = files.filter((file) => file.endsWith('.vue')).map((file) => join(dir, file))
        return hasStyle ? [{ dir, sfcs }, ...nested] : nested
      })
  )

  return groups.flat()
}

async function main(): Promise<void> {
  const dirs = (
    await Promise.all(
      PACKAGES.map(async (pkg) =>
        collectComponentDirs(join(REPO_ROOT, 'packages', pkg, 'src', 'components'))
      )
    )
  ).flat()

  const missing = (
    await Promise.all(
      dirs.flatMap(({ sfcs }) =>
        sfcs.map(async (sfc) => {
          const src = await readFile(sfc, 'utf8')
          return STYLE_IMPORT_RE.test(src) ? undefined : relative(REPO_ROOT, sfc)
        })
      )
    )
  ).filter((path) => path !== undefined)

  if (missing.length > 0) {
    console.error(
      "[check-component-styles] 以下组件 SFC 缺少 `import './style'`，样式不会随组件按需加载：\n" +
        missing.map((path) => `  - ${path}`).join('\n')
    )
    process.exit(1)
  }

  console.log('[check-component-styles] ok')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[check-component-styles] ${message}`)
  process.exit(1)
})
