import { resolve } from 'node:path'
import { select, confirm, input } from '@inquirer/prompts'
import { readJson, writeJson } from '@cat-kit/be'
import { $ } from 'execa'
import { ROOT, UI_ROOT, DIST_ROOT } from './shared'

// ========================= 类型定义 =========================

type ReleaseType = 'patch' | 'minor' | 'major' | 'custom' | 'current'

interface Version {
  major: number
  minor: number
  patch: number
}

// ========================= 版本解析工具 =========================

/** 解析版本号字符串为结构化对象 */
function parseVersion(version: string): Version {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match) {
    throw new Error(`无效的版本号格式: ${version}`)
  }
  const [, major, minor, patch] = match
  return {
    major: parseInt(major!, 10),
    minor: parseInt(minor!, 10),
    patch: parseInt(patch!, 10)
  }
}

/** 将版本对象序列化为字符串 */
function formatVersion(version: Version): string {
  return `${version.major}.${version.minor}.${version.patch}`
}

/** 根据发布类型递增版本号 */
function bumpVersion(
  current: Version,
  type: Exclude<ReleaseType, 'custom'>
): Version {
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

// ========================= Git 操作封装 =========================

/** 创建绑定到 ROOT 目录的 execa 实例 */
const $$ = $({ cwd: ROOT })

/** 检查是否存在指定的 tag */
async function tagExists(tag: string): Promise<boolean> {
  try {
    await $$`git rev-parse refs/tags/${tag}`
    return true
  } catch {
    return false
  }
}

// ========================= 核心发布函数 =========================

/**
 * 交互式选择版本更新类型
 * @returns 新版本号字符串
 */
export async function promptVersion(): Promise<string> {
  const pkgPath = resolve(UI_ROOT, 'package.json')
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
      {
        name: `当前版本 (${currentVersion})`,
        value: 'current'
      },
      {
        name: '自定义版本',
        value: 'custom'
      }
    ]
  })

  let newVersion: string

  if (releaseType === 'custom') {
    newVersion = await input({
      message: '输入自定义版本号 (格式: x.y.z)',
      validate: value => {
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

/**
 * 更新 package.json 中的版本号
 * @param version 新版本号
 * @param targets 需要更新的 package.json 路径列表
 */
export async function updateVersion(
  version: string,
  targets: string[]
): Promise<void> {
  for (const target of targets) {
    const pkg = await readJson<Record<string, unknown>>(target)
    pkg.version = version
    await writeJson(target, pkg)
    console.log(`  ✅ 已更新: ${target}`)
  }
}

/**
 * 创建版本提交
 * @param version 版本号
 * @param files 需要暂存的文件列表（为空时暂存所有变更）
 */
export async function commitRelease(
  version: string,
  files?: string[]
): Promise<void> {
  console.log(`\n📝 正在创建提交...`)

  // 暂存文件
  if (files && files.length > 0) {
    for (const file of files) {
      await $$`git add ${file}`
    }
  } else {
    await $$`git add -A`
  }

  // 检查是否有需要提交的内容
  const { stdout: status } = await $$`git status --porcelain`
  if (!status) {
    console.log('  ⚠️  没有需要提交的变更')
    return
  }

  // 创建提交
  const commitMessage = `release: v${version}`
  await $$`git commit -m ${commitMessage}`
  console.log(`  ✅ 已创建提交: ${commitMessage}`)
}

/**
 * 创建 Git 标签
 * @param version 版本号
 * @param options.message 标签消息（可选）
 * @param options.push 是否推送到远程（默认 false）
 */
export async function createTag(
  version: string,
  options?: {
    message?: string
    push?: boolean
  }
): Promise<void> {
  const tag = `v${version}`
  const message = options?.message ?? `Release ${tag}`
  const push = options?.push ?? false

  console.log(`\n🏷️  正在创建标签...`)

  // 检查 tag 是否已存在
  if (await tagExists(tag)) {
    const shouldOverwrite = await confirm({
      message: `标签 ${tag} 已存在，是否覆盖？`,
      default: false
    })

    if (!shouldOverwrite) {
      console.log('  ❌ 已取消创建标签')
      return
    }

    // 删除本地已存在的 tag
    await $$`git tag -d ${tag}`
  }

  // 创建带注释的 tag
  await $$`git tag -a ${tag} -m ${message}`
  console.log(`  ✅ 已创建标签: ${tag}`)

  // 推送到远程
  if (push) {
    console.log(`\n🚀 正在推送到远程...`)
    await $$`git push`
    await $$`git push origin ${tag}`
    console.log(`  ✅ 已推送提交和标签到远程`)
  }
}

/**
 * 发布到 npm
 * @param cwd 发布目录，默认为 DIST_ROOT
 */
export async function publish(cwd: string = DIST_ROOT): Promise<void> {
  console.log(`\n📦 正在发布到 npm...`)
  await $({ cwd })`npm publish`
  console.log(`  ✅ 发布成功`)
}

/**
 * 完整的发布流程
 * 包含: 提交 -> 打标签 -> 推送 -> npm 发布
 * @param version 版本号
 */
export async function release(version: string): Promise<void> {
  // 1. 提交
  await commitRelease(version)

  // 2. 创建标签
  await createTag(version)

  // 3. 询问是否推送
  const shouldPush = await confirm({
    message: '是否推送提交和标签到远程仓库？',
    default: true
  })

  if (shouldPush) {
    console.log(`\n🚀 正在推送到远程...`)
    await $$`git push`
    console.log(`  ✅ 已推送提交和标签到远程`)
  }

  // 4. 发布到 npm
  await publish()

  console.log(`\n🎉 发布 v${version} 完成！\n`)
}
