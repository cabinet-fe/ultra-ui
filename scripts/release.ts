#!/usr/bin/env bun

import { spawnSync, type SpawnSyncOptions } from 'node:child_process'
import { readdir, readFile, writeFile } from 'node:fs/promises'
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

type BumpType = 'patch' | 'minor' | 'major'

type RunResult = { code: number; stdout: string; stderr: string }

const BUMP_RANK: Record<BumpType, number> = { patch: 0, minor: 1, major: 2 }

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

function parseChangesetFrontmatter(raw: string): { packageName: string; bump: BumpType }[] {
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/)

  if (!match) {
    return []
  }

  const entries: { packageName: string; bump: BumpType }[] = []

  for (const line of (match[1] ?? '').split(/\r?\n/)) {
    const packageMatch = line
      .trim()
      .match(/^['"]?(@[^'":\s]+\/[^'":\s]+)['"]?\s*:\s*(patch|minor|major)\s*$/)

    if (packageMatch?.[1] && packageMatch[2]) {
      entries.push({ packageName: packageMatch[1], bump: packageMatch[2] as BumpType })
    }
  }

  return entries
}

async function collectChangesetBumpTypesFromContents(
  contents: readonly string[]
): Promise<Map<string, BumpType>> {
  const bumpTypes = new Map<string, BumpType>()

  for (const raw of contents) {
    for (const { packageName, bump } of parseChangesetFrontmatter(raw)) {
      const current = bumpTypes.get(packageName)

      if (!current || BUMP_RANK[bump] > BUMP_RANK[current]) {
        bumpTypes.set(packageName, bump)
      }
    }
  }

  return bumpTypes
}

function maxBumpType(types: Iterable<BumpType>): BumpType {
  let max: BumpType = 'patch'

  for (const type of types) {
    if (BUMP_RANK[type] > BUMP_RANK[max]) {
      max = type
    }
  }

  return max
}

function parseSemver(version: string): [number, number, number] {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version)

  if (!match) {
    throw new Error(`无效版本号: ${version}`)
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function bumpSemver(version: string, type: BumpType): string {
  const [major, minor, patch] = parseSemver(version)

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
  }
}

function compareSemver(a: string, b: string): number {
  const av = parseSemver(a)
  const bv = parseSemver(b)

  for (let index = 0; index < 3; index += 1) {
    if (av[index]! > bv[index]!) {
      return 1
    }

    if (av[index]! < bv[index]!) {
      return -1
    }
  }

  return 0
}

function packageJsonPath(packageName: string): string {
  const shortName = packageName.replace(/^@veltra\//, '')

  return join(REPO_ROOT, 'packages', shortName, 'package.json')
}

function changelogPath(packageName: string): string {
  const shortName = packageName.replace(/^@veltra\//, '')

  return join(REPO_ROOT, 'packages', shortName, 'CHANGELOG.md')
}

function readPackageVersionFromGit(packageName: string): string {
  const relativePath = packageJsonPath(packageName).slice(REPO_ROOT.length + 1)
  const result = run('git', ['show', `HEAD:${relativePath}`])

  if (result.code !== 0) {
    fatal(`读取 ${packageName} 发版前版本失败`, result.stderr)
  }

  const versionMatch = result.stdout.match(/"version"\s*:\s*"([^"]+)"/)

  if (!versionMatch?.[1]) {
    fatal(`无法解析 ${packageName} 的版本号`)
  }

  return versionMatch[1]
}

async function readFixedGroups(): Promise<string[][]> {
  const config = JSON.parse(await readFile(join(CHANGESET_DIR, 'config.json'), 'utf8')) as {
    fixed?: string[][]
  }

  return config.fixed ?? []
}

async function correctFixedGroupPeerMajorBumps(
  bumpTypes: ReadonlyMap<string, BumpType>
): Promise<void> {
  const fixedGroups = await readFixedGroups()

  if (fixedGroups.length === 0) {
    return
  }

  const intendedBump = maxBumpType(bumpTypes.values())

  if (intendedBump === 'major') {
    return
  }

  const correctedGroups = await Promise.all(
    fixedGroups.map(async (group) => {
      const groupAffected = group.some((packageName) => bumpTypes.has(packageName))

      if (!groupAffected) {
        return []
      }

      const anchorPackage = group.find((packageName) => bumpTypes.has(packageName))!
      const expectedVersion = bumpSemver(readPackageVersionFromGit(anchorPackage), intendedBump)
      const corrected = await Promise.all(
        group.map(async (packageName) => {
          const pkgJsonPath = packageJsonPath(packageName)
          const pkgJson = JSON.parse(await readFile(pkgJsonPath, 'utf8')) as { version: string }

          if (compareSemver(pkgJson.version, expectedVersion) <= 0) {
            return null
          }

          const wrongVersion = pkgJson.version
          pkgJson.version = expectedVersion
          await writeFile(pkgJsonPath, `${JSON.stringify(pkgJson, null, 2)}\n`)

          const logPath = changelogPath(packageName)

          try {
            let changelog = await readFile(logPath, 'utf8')
            changelog = changelog.replace(`## ${wrongVersion}\n`, `## ${expectedVersion}\n`)

            for (const dep of group) {
              changelog = changelog.replaceAll(
                `@${dep}@${wrongVersion}`,
                `@${dep}@${expectedVersion}`
              )
            }

            await writeFile(logPath, changelog)
          } catch {
            // 部分包可能没有 CHANGELOG
          }

          return `${packageName} ${wrongVersion} → ${expectedVersion}`
        })
      )

      return corrected.filter((line): line is string => line !== null)
    })
  )

  const correctedLines = correctedGroups.flat()

  if (correctedLines.length > 0) {
    console.log(
      '[release] 已修正 fixed 组因 peer 依赖被误抬的 major 版本（changeset 意图为 %s）：',
      intendedBump
    )

    for (const line of correctedLines) {
      console.log(`  - ${line}`)
    }
  }
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

  const changesetContents = await Promise.all(changesetFiles.map((file) => readFile(file, 'utf8')))
  const bumpTypes = await collectChangesetBumpTypesFromContents(changesetContents)
  const packages = [...bumpTypes.keys()].toSorted()

  if (packages.length === 0) {
    fatal('解析 changeset 未得到任何包，请检查 changeset frontmatter')
  }

  printPackages(packages)

  console.log('[release] 阶段 2/4：执行 changeset version 和 vp install')
  const versionCode = runInherit('bun', ['run', 'version-packages'])

  if (versionCode !== 0) {
    fatal('changeset version 失败')
  }

  await correctFixedGroupPeerMajorBumps(bumpTypes)

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
