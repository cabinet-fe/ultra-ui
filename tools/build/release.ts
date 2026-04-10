import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { readJson, writeJson } from '@cat-kit/be'
import { select, confirm, input } from '@inquirer/prompts'
import { $ } from 'execa'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../..')
const DESKTOP_PKG = resolve(ROOT, 'packages/desktop')

const PUBLISH_PKG_ROOTS = [
  resolve(ROOT, 'packages/utils'),
  resolve(ROOT, 'packages/styles'),
  resolve(ROOT, 'packages/compositions'),
  resolve(ROOT, 'packages/directives'),
  resolve(ROOT, 'packages/desktop'),
  resolve(ROOT, 'packages/icons')
] as const

type ReleaseType = 'patch' | 'minor' | 'major' | 'custom' | 'current'

interface Version {
  major: number
  minor: number
  patch: number
}

function parseVersion(version: string): Version {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match) {
    throw new Error(`无效的版本号格式: ${version}`)
  }
  const [, major, minor, patch] = match
  return { major: parseInt(major!, 10), minor: parseInt(minor!, 10), patch: parseInt(patch!, 10) }
}

function formatVersion(version: Version): string {
  return `${version.major}.${version.minor}.${version.patch}`
}

function bumpVersion(current: Version, type: Exclude<ReleaseType, 'custom'>): Version {
  switch (type) {
    case 'patch':
      return { ...current, patch: current.patch + 1 }
    case 'minor':
      return { ...current, minor: current.minor + 1, patch: 0 }
    case 'major':
      return { major: current.major + 1, minor: 0, patch: 0 }
    case 'current':
      return current
  }
}

const $$ = $({ cwd: ROOT })

async function tagExists(tag: string): Promise<boolean> {
  try {
    await $$`git rev-parse refs/tags/${tag}`
    return true
  } catch {
    return false
  }
}

export async function promptVersion(): Promise<string> {
  const pkgPath = resolve(DESKTOP_PKG, 'package.json')
  const pkg = await readJson<{ version: string }>(pkgPath)
  const currentVersion = pkg.version
  const current = parseVersion(currentVersion)

  console.log(`\n📦 当前版本: ${currentVersion}\n`)

  const releaseType = await select<ReleaseType>({
    message: '选择版本更新类型',
    choices: [
      {
        name: `patch (${formatVersion(bumpVersion(current, 'patch'))}) - 修复问题`,
        value: 'patch'
      },
      {
        name: `minor (${formatVersion(bumpVersion(current, 'minor'))}) - 新增功能`,
        value: 'minor'
      },
      {
        name: `major (${formatVersion(bumpVersion(current, 'major'))}) - 重大变更`,
        value: 'major'
      },
      { name: `当前版本 (${currentVersion})`, value: 'current' },
      { name: '自定义版本', value: 'custom' }
    ]
  })

  let newVersion: string

  if (releaseType === 'custom') {
    newVersion = await input({
      message: '输入自定义版本号 (格式: x.y.z)',
      validate: (value) => {
        if (!/^\d+\.\d+\.\d+$/.test(value)) {
          return '版本号格式无效，请使用 x.y.z 格式'
        }
        return true
      }
    })
  } else {
    newVersion = formatVersion(bumpVersion(current, releaseType))
  }

  return newVersion
}

export async function updateVersion(version: string, targets: string[]): Promise<void> {
  for (const target of targets) {
    const pkg = await readJson<Record<string, unknown>>(target)
    pkg.version = version
    await writeJson(target, pkg)
    console.log(`  ✅ 已更新: ${target}`)
  }
}

export async function commitRelease(version: string, files?: string[]): Promise<void> {
  console.log(`\n📝 正在创建提交...`)

  if (files && files.length > 0) {
    for (const file of files) {
      await $$`git add ${file}`
    }
  } else {
    await $$`git add -A`
  }

  const { stdout: status } = await $$`git status --porcelain`
  if (!status) {
    console.log('  ⚠️  没有需要提交的变更')
    return
  }

  const commitMessage = `release: v${version}`
  await $$`git commit -m ${commitMessage}`
  console.log(`  ✅ 已创建提交: ${commitMessage}`)
}

export async function createTag(
  version: string,
  options?: { message?: string; push?: boolean }
): Promise<void> {
  const tag = `v${version}`
  const message = options?.message ?? `Release ${tag}`
  const push = options?.push ?? false

  console.log(`\n🏷️  正在创建标签...`)

  if (await tagExists(tag)) {
    const shouldOverwrite = await confirm({
      message: `标签 ${tag} 已存在，是否覆盖？`,
      default: false
    })

    if (!shouldOverwrite) {
      console.log('  ❌ 已取消创建标签')
      return
    }

    await $$`git tag -d ${tag}`
  }

  await $$`git tag -a ${tag} -m ${message}`
  console.log(`  ✅ 已创建标签: ${tag}`)

  if (push) {
    console.log(`\n🚀 正在推送到远程...`)
    await $$`git push`
    await $$`git push origin ${tag}`
    console.log(`  ✅ 已推送提交和标签到远程`)
  }
}

const REGISTRY = 'http://192.168.31.250:6005'

export async function publishAll(): Promise<void> {
  console.log(`\n📦 正在发布到 npm（${REGISTRY}）...`)
  for (const dir of PUBLISH_PKG_ROOTS) {
    const pkg = await readJson<{ name: string }>(resolve(dir, 'package.json'))
    console.log(`  → ${pkg.name}`)
    await $({ cwd: dir })`npm publish --registry ${REGISTRY}`
  }
  console.log(`  ✅ 全部包已发布`)
}

export async function release(version: string): Promise<void> {
  await commitRelease(version)

  await createTag(version)

  const shouldPush = await confirm({ message: '是否推送提交和标签到远程仓库？', default: true })

  if (shouldPush) {
    console.log(`\n🚀 正在推送到远程...`)
    await $$`git push`
    console.log(`  ✅ 已推送提交和标签到远程`)
  }

  await publishAll()

  console.log(`\n🎉 发布 v${version} 完成！\n`)
}

export function versionTargets(): string[] {
  return PUBLISH_PKG_ROOTS.map((d) => resolve(d, 'package.json'))
}
