import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const AC_ROOT_DIR = '.agent-context'
const PLAN_FILE_NAME = 'plan.md'
const PLAN_DIR_RE = /^plan-(\d+)$/
const DONE_DIR_RE = /^plan-(\d+)(?:-\d{8})?$/
const PATCH_FILE_RE = /^patch-([1-9]\d*)\.md$/
const STATUS_RE = /^>\s*状态:\s*(未执行|已执行)$/m

export function resolveRuntimeContext(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  const cwd = resolve(options.cwd)
  const acRoot = join(cwd, AC_ROOT_DIR)

  if (!existsSync(acRoot)) {
    throw new Error('未找到 ' + AC_ROOT_DIR + ' 目录: ' + acRoot)
  }

  const env = resolveEnvConfig(acRoot)
  const scope = env.scope
  const scopeDir = join(acRoot, scope)
  const currentPlan = resolveCurrentPlan(scopeDir)
  const patchPlanDir = options.planDir ? resolve(cwd, options.planDir) : (currentPlan?.dir ?? null)

  return {
    cwd,
    acRoot,
    scope,
    runner: env.runner,
    scopeDir,
    preparingDir: join(scopeDir, 'preparing'),
    doneDir: join(scopeDir, 'done'),
    currentPlan,
    currentPlanNumber: currentPlan?.number ?? null,
    currentPlanStatus: currentPlan?.status ?? null,
    currentPlanDir: currentPlan?.dir ?? null,
    currentPlanFile: currentPlan ? join(currentPlan.dir, PLAN_FILE_NAME) : null,
    nextPlanNumber: resolveNextPlanNumber(scopeDir),
    nextPatchNumber: patchPlanDir ? resolveNextPatchNumber(patchPlanDir) : null
  }
}

export function writeValue(value) {
  process.stdout.write(String(value) + '\n')
}

export function writeJson(value) {
  process.stdout.write(JSON.stringify(value, null, 2) + '\n')
}

export function requireCurrentPlan(context) {
  if (!context.currentPlan) {
    throw new Error('当前没有计划。')
  }
  return context.currentPlan
}

export function requireNextPatchNumber(context) {
  if (context.nextPatchNumber === null) {
    throw new Error('当前没有计划，无法计算新补丁序号；可使用 --plan-dir 指定计划目录。')
  }
  return context.nextPatchNumber
}

function parseArgs(argv) {
  let cwd = process.cwd()
  let planDir = null

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]

    if (arg === '--cwd') {
      cwd = requireArgValue(argv, ++i, '--cwd')
      continue
    }

    if (arg === '--plan-dir') {
      planDir = requireArgValue(argv, ++i, '--plan-dir')
      continue
    }

    throw new Error('不支持的参数: ' + arg)
  }

  return { cwd, planDir }
}

function requireArgValue(argv, index, optionName) {
  const value = argv[index]
  if (!value) {
    throw new Error(optionName + ' 需要一个值。')
  }
  return value
}

function resolveEnvConfig(acRoot) {
  const envFile = join(acRoot, '.env')
  if (!existsSync(envFile)) {
    throw new Error('未找到 .agent-context/.env。')
  }

  const lines = readFileSync(envFile, 'utf8').split(/\r?\n/)
  let scope = null
  let runner = 'node'

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    if (line.startsWith('SCOPE=')) {
      scope = line.slice('SCOPE='.length).trim()
      if (!scope) {
        throw new Error('.agent-context/.env 中的 SCOPE 为空。')
      }
      continue
    }

    if (line.startsWith('RUNNER=')) {
      runner = normalizeRunner(line.slice('RUNNER='.length))
    }
  }

  if (!scope) {
    throw new Error('.agent-context/.env 缺少 SCOPE 配置。')
  }

  return { scope, runner }
}

function normalizeRunner(value) {
  const runner = value.trim()

  if (runner === 'node' || runner === 'bun') {
    return runner
  }

  throw new Error('.agent-context/.env 中的 RUNNER 仅支持 node 或 bun。')
}

function resolveCurrentPlan(scopeDir) {
  const numbers = readPlanNumbers(scopeDir, PLAN_DIR_RE)

  if (numbers.length > 1) {
    throw new Error('检测到多个当前计划，请先执行 agent-context validate 修复。')
  }

  const number = numbers[0]
  if (number === undefined) {
    return null
  }

  const dir = join(scopeDir, 'plan-' + number)
  return { number, dir, status: readPlanStatus(dir) }
}

function readPlanStatus(planDir) {
  const planFile = join(planDir, PLAN_FILE_NAME)
  if (!existsSync(planFile)) {
    return '未执行'
  }

  const content = readFileSync(planFile, 'utf8')
  const match = content.match(STATUS_RE)
  return match?.[1] ?? '未执行'
}

function resolveNextPlanNumber(scopeDir) {
  const numbers = [
    ...readPlanNumbers(scopeDir, PLAN_DIR_RE),
    ...readPlanNumbers(join(scopeDir, 'preparing'), PLAN_DIR_RE),
    ...readPlanNumbers(join(scopeDir, 'done'), DONE_DIR_RE)
  ]

  if (numbers.length === 0) {
    return 1
  }

  return Math.max(...numbers) + 1
}

function resolveNextPatchNumber(planDir) {
  if (!existsSync(planDir)) {
    throw new Error('计划目录不存在: ' + planDir)
  }

  const entries = readdirSync(planDir, { withFileTypes: true })
  let max = 0

  for (const entry of entries) {
    if (!entry.isFile()) continue
    const match = entry.name.match(PATCH_FILE_RE)
    if (!match?.[1]) continue
    const number = Number.parseInt(match[1], 10)
    if (number > max) {
      max = number
    }
  }

  return max + 1
}

function readPlanNumbers(parentDir, pattern) {
  if (!existsSync(parentDir)) {
    return []
  }

  return readdirSync(parentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name.match(pattern)?.[1])
    .filter((value) => value !== undefined)
    .map((value) => Number.parseInt(value, 10))
    .sort((a, b) => a - b)
}

// ── Main ─────────────────────────────────────────────

const context = resolveRuntimeContext()
writeJson(context)
