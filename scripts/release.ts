#!/usr/bin/env bun

import { spawnSync, type SpawnSyncOptions } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const CHANGESET_DIR = join(REPO_ROOT, '.changeset')
const RELEASE_BRANCH = 'dev'

const HELP_FOOTER = `
若远端 CI 发布失败：
  1. 优先在 GitHub Actions 页面重跑该次 release workflow。
  2. 若 npm 尚未发布且需要撤销版本提交，使用 git revert 生成回滚提交后再推送。
`

type CliArgs = { dryRun: boolean; force: boolean; help: boolean }

type RunResult = { code: number; stdout: string; stderr: string }

function parseArgs(argv: readonly string[]): CliArgs {
  const args: CliArgs = { dryRun: false, force: false, help: false }

  for (const token of argv) {
    if (token === '--dry-run') {
      args.dryRun = true
    } else if (token === '--force') {
      args.force = true
    } else if (token === '--help' || token === '-h') {
      args.help = true
    } else {
      throw new Error(`未知参数: ${token}`)
    }
  }

  return args
}

function printHelp(): void {
  console.log(`用法：bun run release [flags]

flags：
  --dry-run              执行 changeset version 后回滚本地变更，不 commit/push
  --force                允许非 ${RELEASE_BRANCH} 分支执行
  -h, --help             打印本帮助

发布范围由 .changeset/ 中保留的 changeset 文件决定。
版本提交推送到 ${RELEASE_BRANCH} 后，远端 release workflow 会自动完成类型检查、测试、构建、npm publish 和 GitHub Release notes。
${HELP_FOOTER}`)
}

function run(cmd: string, args: readonly string[], opts: SpawnSyncOptions = {}): RunResult {
  const result = spawnSync(cmd, args as string[], { cwd: REPO_ROOT, encoding: 'utf8', ...opts })

  return {
    code: result.status ?? -1,
    stdout: typeof result.stdout === 'string' ? result.stdout : '',
    stderr: typeof result.stderr === 'string' ? result.stderr : ''
  }
}

function runInherit(cmd: string, args: readonly string[]): number {
  const result = spawnSync(cmd, args as string[], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: process.env
  })

  return result.status ?? -1
}

function fatal(message: string, detail: string | null = null): never {
  console.error(`[release] ${message}`)
  if (detail) {
    console.error(detail)
  }
  console.error(HELP_FOOTER)
  process.exit(1)
}

async function listChangesetFiles(): Promise<string[]> {
  const entries = await readdir(CHANGESET_DIR, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md')
    .map((entry) => join(CHANGESET_DIR, entry.name))
    .toSorted()
}

async function collectChangesetPackages(files: readonly string[]): Promise<string[]> {
  const packages = new Set<string>()
  const contents = await Promise.all(files.map((file) => readFile(file, 'utf8')))

  for (const raw of contents) {
    const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/)

    if (!match) {
      continue
    }

    for (const line of (match[1] ?? '').split(/\r?\n/)) {
      const packageMatch = line
        .trim()
        .match(/^['"]?(@[^'":\s]+\/[^'":\s]+)['"]?\s*:\s*(patch|minor|major)\s*$/)

      if (packageMatch?.[1]) {
        packages.add(packageMatch[1])
      }
    }
  }

  return [...packages].toSorted()
}

async function ensureCleanWorkTree(): Promise<void> {
  const status = run('git', ['status', '--porcelain'])

  if (status.code !== 0) {
    fatal(`git status 失败，退出码 ${status.code}`, status.stderr)
  }

  if (status.stdout.trim()) {
    fatal('工作区非干净，请先提交或暂存当前变更：', status.stdout)
  }
}

async function getCurrentBranch(): Promise<string> {
  const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD'])

  if (branch.code !== 0) {
    fatal(`git rev-parse 失败，退出码 ${branch.code}`, branch.stderr)
  }

  return branch.stdout.trim()
}

async function ensureBranchOk(force: boolean): Promise<string> {
  const branch = await getCurrentBranch()

  if (branch !== RELEASE_BRANCH) {
    if (!force) {
      fatal(`当前分支为 ${branch}，release 仅允许在 ${RELEASE_BRANCH} 执行；如需继续请加 --force`)
    }

    console.warn(`[release] 非 ${RELEASE_BRANCH} 分支（${branch}），已通过 --force 跳过检查`)
  }

  return branch
}

async function ensureUpToDate(): Promise<void> {
  const fetch = run('git', ['fetch', 'origin', RELEASE_BRANCH, '--quiet'])

  if (fetch.code !== 0) {
    fatal(`git fetch origin ${RELEASE_BRANCH} 失败`, fetch.stderr)
  }

  const ahead = run('git', ['rev-list', '--count', `HEAD..origin/${RELEASE_BRANCH}`])

  if (ahead.code !== 0) {
    fatal('git rev-list 失败', ahead.stderr)
  }

  const behindCount = Number.parseInt(ahead.stdout.trim(), 10)

  if (Number.isFinite(behindCount) && behindCount > 0) {
    fatal(
      `本地落后于 origin/${RELEASE_BRANCH}（${behindCount} commits），请先同步 ${RELEASE_BRANCH}`
    )
  }
}

function printPackages(packages: readonly string[]): void {
  console.log('[release] 待发布 changeset 涉及的包：')

  for (const packageName of packages) {
    console.log(`  - ${packageName}`)
  }
}

function commitTitleFor(packages: readonly string[]): string {
  if (packages.length === 0) {
    return 'chore(release): publish packages'
  }

  const shortNames = packages.map((packageName) => packageName.replace(/^@veltra\//, ''))

  return `chore(release): publish ${shortNames.join(', ')}`
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    return
  }

  console.log('[release] 阶段 1/4：前置检查')
  await ensureCleanWorkTree()
  const branch = await ensureBranchOk(args.force)
  await ensureUpToDate()

  const changesetFiles = await listChangesetFiles()

  if (changesetFiles.length === 0) {
    fatal('未发现待消费的 changeset（.changeset/*.md）；请先执行 bun run changeset')
  }

  const packages = await collectChangesetPackages(changesetFiles)

  if (packages.length === 0) {
    fatal('解析 changeset 未得到任何包，请检查 changeset frontmatter')
  }

  printPackages(packages)

  console.log('[release] 阶段 2/4：执行 changeset version 和 vp install')
  const versionCode = runInherit('bun', ['run', 'version-packages'])

  if (versionCode !== 0) {
    fatal('changeset version 失败')
  }

  const installCode = runInherit('vp', ['install'])

  if (installCode !== 0) {
    fatal('vp install 失败')
  }

  console.log('[release] 阶段 2.5/4：生成 veltra-ui skill 索引')
  const skillGenCode = runInherit('bun', ['run', 'skill:gen'])

  if (skillGenCode !== 0) {
    fatal('skill:gen 失败')
  }

  if (args.dryRun) {
    console.log('[release] dry-run：跳过 commit/push，并回滚本地变更')
    const restoreCode = runInherit('git', ['restore', '--', '.'])

    if (restoreCode !== 0) {
      console.warn('[release] git restore 失败，请手动检查工作区')
    }

    return
  }

  console.log('[release] 阶段 3/4：提交版本变更')
  const addCode = runInherit('git', [
    'add',
    '.changeset',
    'packages',
    'package.json',
    'bun.lock',
    'skills'
  ])

  if (addCode !== 0) {
    fatal('git add 失败')
  }

  const stagedDiff = run('git', ['diff', '--cached', '--quiet'])

  if (stagedDiff.code === 0) {
    fatal('暂存区无变更，changeset version 可能未产生差异')
  }

  const commitCode = runInherit('git', ['commit', '-m', commitTitleFor(packages)])

  if (commitCode !== 0) {
    fatal('git commit 失败')
  }

  console.log('[release] 阶段 4/4：推送版本提交')
  const pushCode = runInherit('git', ['push', 'origin', 'HEAD'])

  if (pushCode !== 0) {
    fatal('git push 失败')
  }

  const head = run('git', ['rev-parse', '--short', 'HEAD'])

  console.log('')
  console.log(
    '[release] 已推送版本提交，远端 release workflow 将由 packages/*/CHANGELOG.md 变更自动触发'
  )
  console.log(`  分支: ${branch}`)
  console.log(`  提交: ${head.stdout.trim()}`)
  console.log('  查看: https://github.com/cabinet-fe/ultra-ui/actions/workflows/release.yml')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[release] ${message}`)
  console.error(HELP_FOOTER)
  process.exit(1)
})
