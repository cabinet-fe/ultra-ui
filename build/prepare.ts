import fg from 'fast-glob'
import { resolve } from 'node:path'
import { syncDependencies } from '@cat-kit/maintenance'
import { copyFile, cp, readJson, writeFile, writeJson } from '@cat-kit/be'
import { PUBLISH_PACKAGES, ROOT, STYLES_SRC } from './shared'

export async function copy(
  patterns: string | string[],
  srcDir: string,
  destDir: string
) {
  const files = await fg(patterns, { cwd: srcDir })
  await Promise.all(
    files.map(file => cp(resolve(srcDir, file), resolve(destDir, file)))
  )
}

/** 将源码包内指向 ./dist/ 的字段改为相对 dist 目录根的路径 */
function rewriteDistRelativePaths(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.split('./dist/').join('./')
  }
  if (Array.isArray(value)) {
    return value.map(rewriteDistRelativePaths)
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        rewriteDistRelativePaths(v)
      ])
    )
  }
  return value
}

/** dist 目录内的 manifest：入口相对当前目录，且不再使用 files: [\"dist\"] */
function packageJsonForDistDirectory(
  pkg: Record<string, unknown>
): Record<string, unknown> {
  const next = rewriteDistRelativePaths(pkg) as Record<string, unknown>
  delete next.files
  return next
}

export async function copyFiles() {
  const stylesDist = resolve(ROOT, 'packages/styles/dist')
  await copy(['_*.scss', 'fonts/*'], STYLES_SRC, stylesDist)

  const readmeSrc = resolve(ROOT, 'README.md')
  for (const { root } of PUBLISH_PACKAGES) {
    const distDir = resolve(root, 'dist')
    await copyFile(readmeSrc, resolve(distDir, 'README.md'))
  }
}

export async function genFiles() {
  for (const { root } of PUBLISH_PACKAGES) {
    const pkgPath = resolve(root, 'package.json')
    const pkg = await readJson<{ version: string }>(pkgPath)
    const version = pkg.version
    const distDir = resolve(root, 'dist')

    await writeFile(
      resolve(distDir, 'version.js'),
      `export const version = '${version}'`
    )
    await writeFile(
      resolve(distDir, 'version.d.ts'),
      `export declare const version: string\n`
    )
  }
}

/** 将可发布的 package.json 写入各包 dist，并把 workspace:* 转为 ^version */
export async function writeDistPackageJson() {
  let version = '1.0.0'
  const distConfigs: { dir: string }[] = []

  for (const { root } of PUBLISH_PACKAGES) {
    const pkgPath = resolve(root, 'package.json')
    const distDir = resolve(root, 'dist')
    const destPath = resolve(distDir, 'package.json')
    await copyFile(pkgPath, destPath)
    const pkg = await readJson<{ version: string }>(pkgPath)
    version = pkg.version
    distConfigs.push({ dir: distDir })
  }

  await syncDependencies(distConfigs, version)

  for (const { root } of PUBLISH_PACKAGES) {
    const destPath = resolve(root, 'dist', 'package.json')
    const pkg = await readJson<Record<string, unknown>>(destPath)
    await writeJson(destPath, packageJsonForDistDirectory(pkg), {
      space: 2,
      eol: '\n'
    })
  }
}
