// 按 git 改动映射受影响的包，只跑相关测试（`bun run test:changed`）。
// 替代 `vp test run --changed`：vitest 5 移除了 forceRerunTriggers，package.json
// 等非测试变更也会触发全量且无法配置关闭。根级文件（bun.lock、根 package.json、
// 根 vite.config.ts 等）影响面全局，回退全量；纯文档改动跳过测试。
// 交叉包回归由 ci:verify 兜底。支持 --dry-run 只打印将执行的范围。
import { execSync } from 'node:child_process'

function gitLines(cmd: string): string[] {
  return execSync(cmd, { encoding: 'utf8' })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

const changed = new Set([
  ...gitLines('git diff --name-only HEAD'),
  ...gitLines('git ls-files --others --exclude-standard')
])

if (changed.size === 0) {
  console.log('无改动，跳过测试')
  process.exit(0)
}

const scopes = new Set<string>()
for (const file of changed) {
  const pkg = file.match(/^packages\/([^/]+)\//)?.[1]
  if (pkg) {
    scopes.add(`packages/${pkg}`)
  } else if (file.startsWith('playground/')) {
    scopes.add('playground')
  } else if (file.startsWith('scripts/')) {
    // scripts 目录当前无测试项目（resolver 生成物、发布与安装脚本），不触发测试
  } else if (
    /\.(md|mdx)$/.test(file) ||
    file.startsWith('.agents/') ||
    file.startsWith('.zcode/') ||
    file.startsWith('agent-docs/')
  ) {
    // 文档与代理配置不触发测试
  } else {
    scopes.clear()
    scopes.add('ALL')
    break
  }
}

const dryRun = process.argv.includes('--dry-run')

if (scopes.has('ALL')) {
  console.log('根级文件有改动，跑全量测试')
  if (!dryRun) execSync('bunx vp test run --passWithNoTests', { stdio: 'inherit' })
} else if (scopes.size === 0) {
  console.log('只有文档/脚本改动，跳过测试')
} else {
  console.log(`跑受影响范围：${[...scopes].join(' ')}`)
  if (!dryRun) {
    execSync(`bunx vp test run ${[...scopes].join(' ')} --passWithNoTests`, { stdio: 'inherit' })
  }
}
