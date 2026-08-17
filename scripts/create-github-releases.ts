#!/usr/bin/env bun

import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

type PublishedPackage = { name: string; version: string }

type ReleaseSpec = {
  tagName: string
  releaseName: string
  body: string
  prerelease: boolean
  targetCommitish: string
}

type ReleaseRecord = { id: number; html_url?: string }

type FetchResponse = { status: number; ok: boolean; text(): Promise<string> }

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const DRY_RUN = process.env.DRY_RUN === '1'

async function readCoreFixedGroup(): Promise<string[]> {
  const configPath = join(REPO_ROOT, '.changeset', 'config.json')
  const config = JSON.parse(await readFile(configPath, 'utf8')) as { fixed?: string[][] }

  return config.fixed?.[0] ?? []
}

function getEnv(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`缺少环境变量: ${name}`)
  }

  return value
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseRepository(value: string): { owner: string; repo: string } {
  const [owner, repo] = value.split('/')

  if (!owner || !repo) {
    throw new Error(`GITHUB_REPOSITORY 格式非法: ${value}`)
  }

  return { owner, repo }
}

async function collectWorkspacePackages(): Promise<PublishedPackage[]> {
  const packagesDir = join(REPO_ROOT, 'packages')
  const entries = await readdir(packagesDir, { withFileTypes: true })
  const packageEntries = entries.filter((entry) => entry.isDirectory() && entry.name !== 'mobile')

  const packages = await Promise.all(
    packageEntries.map(async (entry) => {
      try {
        const pkgJsonPath = join(packagesDir, entry.name, 'package.json')
        const pkg = JSON.parse(await readFile(pkgJsonPath, 'utf8')) as {
          name?: string
          version?: string
          private?: boolean
        }

        if (pkg.name && pkg.version && !pkg.private) {
          return { name: pkg.name, version: pkg.version }
        }
      } catch {
        // 忽略非法目录
      }

      return null
    })
  )

  return packages
    .filter((pkg): pkg is PublishedPackage => pkg !== null)
    .toSorted((a, b) => a.name.localeCompare(b.name))
}

function parsePublishedPackages(raw: string | undefined): PublishedPackage[] {
  if (!raw?.trim()) {
    return []
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }

  if (!Array.isArray(parsed)) {
    return []
  }

  const deduped = new Map<string, PublishedPackage>()

  for (const item of parsed) {
    if (
      !item ||
      typeof item !== 'object' ||
      !('name' in item) ||
      typeof item.name !== 'string' ||
      !('version' in item) ||
      typeof item.version !== 'string'
    ) {
      throw new Error('CHANGESETS_PUBLISHED_PACKAGES 中存在非法条目')
    }

    deduped.set(`${item.name}@${item.version}`, { name: item.name, version: item.version })
  }

  return [...deduped.values()].toSorted((a, b) => a.name.localeCompare(b.name))
}

function isPrerelease(version: string): boolean {
  return version.includes('-')
}

async function readChangelogBody(packageName: string, version: string): Promise<string> {
  const shortName = packageName.replace(/^@veltra\//, '')
  const changelogPath = join(REPO_ROOT, 'packages', shortName, 'CHANGELOG.md')
  let content: string

  try {
    content = await readFile(changelogPath, 'utf8')
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.warn(`warning: ${packageName} 缺少 CHANGELOG.md，release 正文将退回默认文案`)
      return ''
    }

    throw error
  }

  const versionHeading = `## ${version}`
  const pattern = new RegExp(
    `(?:^|\\r?\\n)${escapeRegExp(versionHeading)}\\r?\\n([\\s\\S]*?)(?=\\r?\\n##\\s+|$)`
  )
  const match = content.match(pattern)

  if (!match) {
    console.warn(
      `warning: 未在 ${changelogPath} 找到版本 ${version} 的 changelog 小节，release 正文将退回默认文案`
    )
    return ''
  }

  return (match[1] ?? '').trim()
}

function renderIndependentBody(pkg: PublishedPackage, changelogBody: string): string {
  if (changelogBody) {
    return changelogBody
  }

  return `Released \`${pkg.name}@${pkg.version}\`.\n\n- 无独立 changelog 条目（仅版本同步或依赖同步）`
}

function renderFixedBody(
  version: string,
  coreFixedGroup: readonly string[],
  sections: Array<{ packageName: string; body: string }>
): string {
  const lines = [
    `Released Veltra UI fixed package group \`${version}\`.`,
    '',
    'Packages:',
    ...coreFixedGroup.map((packageName) => `- \`${packageName}@${version}\``),
    ''
  ]

  for (const { packageName, body } of sections) {
    lines.push(`## ${packageName}`)
    lines.push('')
    lines.push(body || '- 无独立 changelog 条目（仅版本同步或内部依赖同步）')
    lines.push('')
  }

  return lines.join('\n').trim()
}

async function buildReleaseSpecs(
  publishedPackages: PublishedPackage[],
  targetCommitish: string
): Promise<ReleaseSpec[]> {
  const coreFixedGroup = await readCoreFixedGroup()
  const coreFixedGroupSet = new Set(coreFixedGroup)
  const fixedPackages = publishedPackages.filter((pkg) => coreFixedGroupSet.has(pkg.name))
  const independentPackages = publishedPackages.filter((pkg) => !coreFixedGroupSet.has(pkg.name))
  const specs: ReleaseSpec[] = []

  if (fixedPackages.length > 0) {
    const versions = new Set(fixedPackages.map((pkg) => pkg.version))

    if (fixedPackages.length !== coreFixedGroup.length || versions.size !== 1) {
      const summary = fixedPackages.map((pkg) => `${pkg.name}@${pkg.version}`).join(', ')
      throw new Error(`fixed 组发布结果不完整，拒绝创建聚合 release: ${summary}`)
    }

    const version = fixedPackages[0]!.version
    const sections = await Promise.all(
      coreFixedGroup.map(async (packageName) => ({
        packageName,
        body: await readChangelogBody(packageName, version)
      }))
    )

    specs.push({
      tagName: `veltra-fixed@${version}`,
      releaseName: `Veltra UI packages v${version}`,
      body: renderFixedBody(version, coreFixedGroup, sections),
      prerelease: isPrerelease(version),
      targetCommitish
    })
  }

  const independentSpecsWithNull = await Promise.all(
    independentPackages.map(async (pkg) => {
      const changelogBody = await readChangelogBody(pkg.name, pkg.version)

      // 在没有显式发布列表时（fallback 扫描），仅为当前版本有对应 CHANGELOG 内容的包生成 release
      if (!changelogBody && !process.env.CHANGESETS_PUBLISHED_PACKAGES?.trim()) {
        return null
      }

      return {
        tagName: `${pkg.name}@${pkg.version}`,
        releaseName: `${pkg.name} v${pkg.version}`,
        body: renderIndependentBody(pkg, changelogBody),
        prerelease: isPrerelease(pkg.version),
        targetCommitish
      }
    })
  )

  const independentSpecs = independentSpecsWithNull.filter(
    (item): item is ReleaseSpec => item !== null
  )

  return [...specs, ...independentSpecs]
}

async function githubRequest<T>(options: {
  method: string
  path: string
  token: string
  body?: unknown
}): Promise<{ status: number; data: T | null }> {
  const response = (await fetch(`https://api.github.com${options.path}`, {
    method: options.method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${options.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ultra-ui-release-script',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  })) as FetchResponse

  const text = await response.text()
  const data = text ? (JSON.parse(text) as T) : null

  if (response.status === 404) {
    return { status: response.status, data: null }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : `GitHub API 请求失败（${response.status}）`

    throw new Error(message)
  }

  return { status: response.status, data }
}

async function upsertRelease(
  spec: ReleaseSpec,
  repository: { owner: string; repo: string },
  token: string
): Promise<void> {
  const releaseByTag = await githubRequest<ReleaseRecord>({
    method: 'GET',
    path: `/repos/${repository.owner}/${repository.repo}/releases/tags/${encodeURIComponent(spec.tagName)}`,
    token
  })

  const payload = {
    tag_name: spec.tagName,
    target_commitish: spec.targetCommitish,
    name: spec.releaseName,
    body: spec.body,
    draft: false,
    prerelease: spec.prerelease
  }

  if (releaseByTag.data) {
    const updated = await githubRequest<ReleaseRecord>({
      method: 'PATCH',
      path: `/repos/${repository.owner}/${repository.repo}/releases/${releaseByTag.data.id}`,
      token,
      body: {
        name: payload.name,
        body: payload.body,
        draft: payload.draft,
        prerelease: payload.prerelease
      }
    })

    console.log(`updated release: ${spec.tagName} -> ${updated.data?.html_url ?? 'ok'}`)
    return
  }

  const created = await githubRequest<ReleaseRecord>({
    method: 'POST',
    path: `/repos/${repository.owner}/${repository.repo}/releases`,
    token,
    body: payload
  })

  console.log(`created release: ${spec.tagName} -> ${created.data?.html_url ?? 'ok'}`)
}

async function main(): Promise<void> {
  const targetCommitish = getEnv('GITHUB_SHA')
  let publishedPackages = parsePublishedPackages(process.env.CHANGESETS_PUBLISHED_PACKAGES)

  if (publishedPackages.length === 0) {
    console.log(
      '[create-github-releases] CHANGESETS_PUBLISHED_PACKAGES 为空，从各 package.json 收集包信息'
    )
    publishedPackages = await collectWorkspacePackages()
  }

  if (publishedPackages.length === 0) {
    console.log('未找到需要创建 release 的包，跳过')
    return
  }

  const specs = await buildReleaseSpecs(publishedPackages, targetCommitish)

  console.log(
    `will create ${specs.length} GitHub release(s) from ${publishedPackages.length} package publish result(s)`
  )

  if (DRY_RUN) {
    for (const spec of specs) {
      console.log(`[dry-run] ${spec.releaseName} <- ${spec.tagName}`)
      console.log(spec.body)
      console.log('---')
    }

    return
  }

  const token = getEnv('GITHUB_TOKEN')
  const repository = parseRepository(getEnv('GITHUB_REPOSITORY'))

  await Promise.all(specs.map((spec) => upsertRelease(spec, repository, token)))
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[create-github-releases] ${message}`)
  process.exit(1)
})
