import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const AC_ROOT_DIR = '.agent-context'
const PLAN_FILE_NAME = 'plan.md'
const PLAN_DIR_RE = /^plan-(\d+)$/
const DONE_DIR_RE = /^plan-(\d+)(?:-\d{8})?$/
const STATUS_RE = /^>\s*状态:\s*(未执行|已执行)$/m

const errors = []

function main() {
  const cwd = resolve(parseCwd(process.argv.slice(2)))
  const acRoot = join(cwd, AC_ROOT_DIR)

  if (!existsSync(acRoot)) {
    fail('未找到 .agent-context 目录: ' + acRoot)
    return
  }

  const scope = readScope(acRoot)
  if (!scope) {
    finish()
    return
  }

  const scopeDir = join(acRoot, scope)
  if (!existsSync(scopeDir)) {
    fail('未找到当前作用域目录: ' + scopeDir)
    finish()
    return
  }

  validateCurrentPlans(scopeDir)
  validatePlans(join(scopeDir), PLAN_DIR_RE)
  validatePlans(join(scopeDir, 'preparing'), PLAN_DIR_RE)
  validatePlans(join(scopeDir, 'done'), DONE_DIR_RE)

  finish()
}

function parseCwd(argv) {
  let cwd = process.cwd()
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg !== '--cwd') {
      fail('不支持的参数: ' + arg)
      continue
    }

    const value = argv[++i]
    if (!value) {
      fail('--cwd 需要一个值。')
      continue
    }
    cwd = value
  }
  return cwd
}

function readScope(acRoot) {
  const envFile = join(acRoot, '.env')
  if (!existsSync(envFile)) {
    fail('未找到 .agent-context/.env。')
    return null
  }

  const lines = readFileSync(envFile, 'utf8').split(/\r?\n/)
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    if (!line.startsWith('SCOPE=')) continue

    const scope = line.slice('SCOPE='.length).trim()
    if (!scope) {
      fail('.agent-context/.env 中的 SCOPE 为空。')
      return null
    }
    return scope
  }

  fail('.agent-context/.env 缺少 SCOPE 配置。')
  return null
}

function validateCurrentPlans(scopeDir) {
  const current = readPlanDirs(scopeDir, PLAN_DIR_RE)
  if (current.length > 1) {
    fail('检测到多个当前计划: ' + current.map((entry) => entry.name).join(', '))
  }
}

function validatePlans(parentDir, pattern) {
  if (!existsSync(parentDir)) return

  for (const entry of readPlanDirs(parentDir, pattern)) {
    const planFile = join(parentDir, entry.name, PLAN_FILE_NAME)
    if (!existsSync(planFile)) {
      fail('计划缺少 plan.md: ' + planFile)
      continue
    }

    const content = readFileSync(planFile, 'utf8')
    if (!STATUS_RE.test(content)) {
      fail('计划状态行必须是 "> 状态: 未执行" 或 "> 状态: 已执行": ' + planFile)
    }
  }
}

function readPlanDirs(parentDir, pattern) {
  if (!existsSync(parentDir)) return []

  return readdirSync(parentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && pattern.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function fail(message) {
  errors.push(message)
}

function finish() {
  if (errors.length === 0) {
    process.stdout.write('bundled validate-context 通过。\n')
    return
  }

  process.stderr.write('bundled validate-context 发现问题：\n')
  for (const error of errors) {
    process.stderr.write('- ' + error + '\n')
  }
  process.exitCode = 1
}

main()
