import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build } from './build'
import { copyFiles, genFiles } from './prepare'
import { release, promptVersion, updateVersion } from './release'
import { DESKTOP_PKG, ROOT } from './shared'

const __dirname = dirname(fileURLToPath(import.meta.url))

const isRelease = process.argv.includes('--release')

/** 独立 Node 子进程编译样式，避免 Bun 在同进程内二次加载 sass-embedded/tsdown 时崩溃。 */
function runBuildStylesInChildProcess(): void {
  const cli = resolve(__dirname, 'cli-build-styles.ts')
  const tsxCli = resolve(__dirname, 'node_modules/tsx/dist/cli.mjs')
  if (!existsSync(tsxCli)) {
    throw new Error(
      '未找到 tools/build/node_modules/tsx。请在仓库根目录执行 bun install 以安装 tools/build 的 devDependencies（含 tsx）。'
    )
  }
  const r = spawnSync('node', [tsxCli, cli], { cwd: __dirname, stdio: 'inherit', env: process.env })
  if (r.error) throw r.error
  if (r.status !== 0) process.exit(r.status ?? 1)
}

async function boot(isRelease: boolean) {
  let version: string | undefined

  if (isRelease) {
    version = await promptVersion()
    await updateVersion(version, [resolve(DESKTOP_PKG, 'package.json')])
  }

  await build()
  runBuildStylesInChildProcess()
  await copyFiles()
  await genFiles()

  if (isRelease && version) {
    await release(version)
  }
}

boot(isRelease)
