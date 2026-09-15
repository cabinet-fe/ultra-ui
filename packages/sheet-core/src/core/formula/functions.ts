import { $n, n } from '@cat-kit/core'

import type { CellRange } from '../address'
import type { AstNode } from './ast'
import { formulaError, isFormulaError, type FormulaError } from './errors'
import {
  coerceToBoolean,
  coerceToNumber,
  coerceToText,
  type EvalValue,
  type FormulaEvalContext,
  type ScalarValue
} from './evaluator'

/**
 * 函数注册表（可扩展）+ 基础函数集。
 *
 * 参数形态约定：区域引用求值为数组（只含稀疏存在的格），直接参数为标量。
 * 聚合函数据此区分 Excel 语义：区域内的文本/布尔被忽略，直接参数则强转（非法 → #VALUE!）。
 * lazy 函数自行求值参数（IF 的短路分支，未选分支的副作用/错误不产生）。
 */

/** 函数分类（弹框分类导航固定集合的子集；未声明的函数不进分类） */
export type FormulaFunctionCategory =
  | '财务'
  | '统计'
  | '查找与引用'
  | '文本'
  | '逻辑'
  | '数学'
  | '日期与时间'

/** 函数补全 / 帮助用元数据（可选；第三方函数可省略） */
export interface FormulaFunctionMeta {
  /** 参数名列表，如 `['number1', 'number2', '...']` */
  params: string[]
  /** 中文一句话说明 */
  description: string
  /** 函数分类；未声明 → 不出现在弹框任何分类下 */
  category?: FormulaFunctionCategory
}

type FormulaFunctionBase = {
  minArgs?: number
  maxArgs?: number
  /** 易失性：任意单元格变更触发重算时所在公式格必重新求值（TODAY/NOW/RAND 等） */
  volatile?: boolean
  /** 补全元数据；缺省时候选仅显示函数名 */
  meta?: FormulaFunctionMeta
}

export type FormulaFunction =
  | (FormulaFunctionBase & {
      kind?: 'normal'
      impl: (args: EvalValue[], ctx?: FormulaEvalContext) => EvalValue
    })
  | (FormulaFunctionBase & {
      kind: 'lazy'
      impl: (
        nodes: AstNode[],
        evalNode: (node: AstNode) => EvalValue,
        ctx?: FormulaEvalContext
      ) => EvalValue
    })

const registry = new Map<string, FormulaFunction>()

/** 注册函数（名称大小写不敏感；同名覆盖，供扩展/自定义函数） */
export function registerFormulaFunction(name: string, def: FormulaFunction): void {
  registry.set(name.toUpperCase(), def)
}

/** 查询函数（大小写不敏感） */
export function getFormulaFunction(name: string): FormulaFunction | undefined {
  return registry.get(name.toUpperCase())
}

/** 公式 AST 是否调用了易失性函数（依赖图在节点注册时据此标记易失性公式格） */
export function astUsesVolatileFunction(node: AstNode): boolean {
  switch (node.kind) {
    case 'call':
      if (getFormulaFunction(node.name)?.volatile) return true
      return node.args.some(astUsesVolatileFunction)
    case 'unary':
    case 'percent':
      return astUsesVolatileFunction(node.operand)
    case 'binary':
      return astUsesVolatileFunction(node.left) || astUsesVolatileFunction(node.right)
    default:
      return false
  }
}

/**
 * 枚举全部已注册函数的补全元数据（名称升序）。
 * 无 meta 的函数仍返回 `{ name, params: [], description: '' }`，供候选仅显示名称；
 * 未声明分类的函数 `category` 为 undefined（仅出现在「全部」与搜索结果）。
 */
export function listFormulaFunctions(): Array<
  { name: string; category: FormulaFunctionCategory | undefined } & FormulaFunctionMeta
> {
  return [...registry.keys()]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => {
      const meta = registry.get(name)!.meta
      return {
        name,
        params: meta?.params ?? [],
        description: meta?.description ?? '',
        category: meta?.category
      }
    })
}

/** 求值器回调：名称解析 + 参数个数校验 + 按 kind 分发（ctx 为公式所在格的求值上下文） */
export function invokeFormulaFunction(
  name: string,
  nodes: AstNode[],
  evalNode: (node: AstNode) => EvalValue,
  ctx?: FormulaEvalContext
): EvalValue {
  const def = getFormulaFunction(name)
  if (!def) return formulaError('#NAME?')
  if (def.minArgs !== undefined && nodes.length < def.minArgs) return formulaError('#VALUE!')
  if (def.maxArgs !== undefined && nodes.length > def.maxArgs) return formulaError('#VALUE!')
  if (def.kind === 'lazy') return def.impl(nodes, evalNode, ctx)
  return def.impl(nodes.map(evalNode), ctx)
}

// ─── 内部工具 ────────────────────────────────────────────────

interface FlatArg {
  value: ScalarValue | FormulaError
  /** 来自区域展开（区别于直接参数：区域内文本/布尔被聚合函数忽略） */
  fromRange: boolean
}

function flattenArgs(args: EvalValue[]): FlatArg[] {
  const out: FlatArg[] = []
  for (const arg of args) {
    if (Array.isArray(arg)) {
      for (const value of arg) out.push({ value, fromRange: true })
    } else {
      out.push({ value: arg, fromRange: false })
    }
  }
  return out
}

/** 收集数字：区域内只取数字格；直接参数强转（非法/错误 → 传播） */
function collectNumbers(args: EvalValue[]): number[] | FormulaError {
  const numbers: number[] = []
  for (const { value, fromRange } of flattenArgs(args)) {
    if (isFormulaError(value)) return value
    if (fromRange) {
      if (typeof value === 'number') numbers.push(value)
      continue
    }
    const num = coerceToNumber(value)
    if (isFormulaError(num)) return num
    numbers.push(num)
  }
  return numbers
}

/** 高精度累加，返回 JS number（空数组为 0） */
function plusAll(numbers: number[]): number {
  let sum = 0
  for (const num of numbers) sum = $n.plus(sum, num)
  return Number(sum)
}

/** 收集布尔：区域内只取布尔格；直接参数强转（非法文本/错误 → 传播）；空值跳过 */
function collectBooleans(args: EvalValue[]): boolean[] | FormulaError {
  const booleans: boolean[] = []
  for (const { value, fromRange } of flattenArgs(args)) {
    if (isFormulaError(value)) return value
    if (fromRange) {
      if (typeof value === 'boolean') booleans.push(value)
      continue
    }
    if (value === null) continue
    const b = coerceToBoolean(value)
    if (isFormulaError(b)) return b
    booleans.push(b)
  }
  return booleans
}

/** 依次强转数字参数（缺省位用 fallback；空格按 0；错误传播） */
function coerceNumberArgs(args: EvalValue[], fallbacks: number[]): number[] | FormulaError {
  const out: number[] = []
  for (let i = 0; i < fallbacks.length; i++) {
    const arg = args[i]
    const num = coerceToNumber(arg === undefined ? fallbacks[i]! : arg)
    if (isFormulaError(num)) return num
    out.push(num)
  }
  return out
}

/** criteria 运算符前缀（双字符在前，避免 `>=` 被截成 `>` + `=`） */
const CRITERIA_OPS = ['>=', '<=', '<>', '>', '<', '='] as const

type CriteriaOp = (typeof CRITERIA_OPS)[number]

function matchesOp(
  left: number | string | boolean,
  right: number | string | boolean,
  op: CriteriaOp
): boolean {
  switch (op) {
    case '=':
      return left === right
    case '<>':
      return left !== right
    case '>':
      return left > right
    case '>=':
      return left >= right
    case '<':
      return left < right
    default:
      return left <= right
  }
}

/**
 * criteria 解析（COUNTIF 条件统计语义锚点）：
 * 识别 `>` / `>=` / `<` / `<=` / `<>` / `=` 前缀与裸值；
 * 数值按数值比较、文本相等不区分大小写，类型不匹配（数值 criteria 对文本格等）不计。
 */
function parseCriteria(raw: ScalarValue): (value: ScalarValue) => boolean {
  const text = typeof raw === 'string' ? raw : raw === null ? '' : String(raw)
  let op: CriteriaOp = '='
  let rest = text
  for (const candidate of CRITERIA_OPS) {
    if (text.startsWith(candidate)) {
      op = candidate
      rest = text.slice(candidate.length)
      break
    }
  }
  const upper = rest.toUpperCase()
  if (upper === 'TRUE' || upper === 'FALSE') {
    const target = upper === 'TRUE'
    return (value) => typeof value === 'boolean' && matchesOp(value, target, op)
  }
  const numeric = coerceToNumber(rest)
  if (!isFormulaError(numeric)) {
    return (value) => typeof value === 'number' && matchesOp(value, numeric, op)
  }
  if (rest === '') {
    // `""` 匹配空白格、`<>""` 匹配非空白格（空白主要来自直接引用参数）
    return (value) => (op === '=' ? value === null : op === '<>' ? value !== null : false)
  }
  return (value) => typeof value === 'string' && matchesOp(value.toUpperCase(), upper, op)
}

// ─── 基础函数集 ─────────────────────────────────────────────

registerFormulaFunction('SUM', {
  minArgs: 1,
  meta: { params: ['number1', 'number2', '...'], description: '求参数之和', category: '数学' },
  impl(args) {
    const numbers = collectNumbers(args)
    if (isFormulaError(numbers)) return numbers
    return plusAll(numbers)
  }
})

registerFormulaFunction('AVERAGE', {
  minArgs: 1,
  meta: { params: ['number1', 'number2', '...'], description: '求参数的平均值', category: '统计' },
  impl(args) {
    const numbers = collectNumbers(args)
    if (isFormulaError(numbers)) return numbers
    if (numbers.length === 0) return formulaError('#DIV/0!')
    return Number($n.div(plusAll(numbers), numbers.length))
  }
})

registerFormulaFunction('MAX', {
  minArgs: 1,
  meta: {
    params: ['number1', 'number2', '...'],
    description: '返回参数中的最大值',
    category: '统计'
  },
  impl(args) {
    const numbers = collectNumbers(args)
    if (isFormulaError(numbers)) return numbers
    if (numbers.length === 0) return 0
    // for 循环比较：Math.max(...spread) 对超大区域（实参 > ~6.5 万）会 RangeError
    // 爆栈并被上层兜成 #ERROR!（#13）；循环无实参展开上限
    let max = numbers[0]!
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i]! > max) max = numbers[i]!
    }
    return max
  }
})

registerFormulaFunction('MIN', {
  minArgs: 1,
  meta: {
    params: ['number1', 'number2', '...'],
    description: '返回参数中的最小值',
    category: '统计'
  },
  impl(args) {
    const numbers = collectNumbers(args)
    if (isFormulaError(numbers)) return numbers
    if (numbers.length === 0) return 0
    let min = numbers[0]!
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i]! < min) min = numbers[i]!
    }
    return min
  }
})

registerFormulaFunction('COUNT', {
  minArgs: 1,
  meta: {
    params: ['value1', 'value2', '...'],
    description: '计算参数中数字的个数',
    category: '统计'
  },
  impl(args) {
    let count = 0
    for (const { value, fromRange } of flattenArgs(args)) {
      if (isFormulaError(value)) return value
      if (fromRange) {
        if (typeof value === 'number') count++
        continue
      }
      // 直接参数：可强转为数字即计数（含 TRUE/FALSE、数字文本）
      if (!isFormulaError(coerceToNumber(value))) count++
    }
    return count
  }
})

registerFormulaFunction('COUNTA', {
  minArgs: 1,
  meta: {
    params: ['value1', 'value2', '...'],
    description: '计算参数中非空值的个数',
    category: '统计'
  },
  impl(args) {
    let count = 0
    for (const { value, fromRange } of flattenArgs(args)) {
      // 直接错误参数传播；区域内的错误格照常计数
      if (!fromRange && isFormulaError(value)) return value
      if (value === null) continue
      count++
    }
    return count
  }
})

registerFormulaFunction('IF', {
  kind: 'lazy',
  minArgs: 2,
  maxArgs: 3,
  meta: {
    params: ['logical_test', 'value_if_true', 'value_if_false'],
    description: '按条件返回不同结果',
    category: '逻辑'
  },
  impl(nodes, evalNode) {
    const cond = coerceToBoolean(evalNode(nodes[0]!))
    if (isFormulaError(cond)) return cond
    if (cond) return evalNode(nodes[1]!)
    return nodes[2] ? evalNode(nodes[2]) : false
  }
})

registerFormulaFunction('AND', {
  minArgs: 1,
  meta: {
    params: ['logical1', 'logical2', '...'],
    description: '全部为真时返回 TRUE',
    category: '逻辑'
  },
  impl(args) {
    const booleans = collectBooleans(args)
    if (isFormulaError(booleans)) return booleans
    if (booleans.length === 0) return formulaError('#VALUE!')
    return booleans.every(Boolean)
  }
})

registerFormulaFunction('OR', {
  minArgs: 1,
  meta: {
    params: ['logical1', 'logical2', '...'],
    description: '任一为真时返回 TRUE',
    category: '逻辑'
  },
  impl(args) {
    const booleans = collectBooleans(args)
    if (isFormulaError(booleans)) return booleans
    if (booleans.length === 0) return formulaError('#VALUE!')
    return booleans.some(Boolean)
  }
})

registerFormulaFunction('NOT', {
  minArgs: 1,
  maxArgs: 1,
  meta: { params: ['logical'], description: '对逻辑值取反', category: '逻辑' },
  impl(args) {
    const b = coerceToBoolean(args[0]!)
    if (isFormulaError(b)) return b
    return !b
  }
})

registerFormulaFunction('ROUND', {
  minArgs: 2,
  maxArgs: 2,
  meta: { params: ['number', 'num_digits'], description: '按指定位数四舍五入', category: '数学' },
  impl(args) {
    const value = coerceToNumber(args[0]!)
    if (isFormulaError(value)) return value
    const digitsArg = coerceToNumber(args[1]!)
    if (isFormulaError(digitsArg)) return digitsArg
    const digits = Math.trunc(digitsArg)
    const factor = 10 ** digits
    // 位数超出 double 精度时四舍五入是恒等/归零
    if (!Number.isFinite(factor)) return value
    if (factor === 0) return 0
    // n().fixed 只接受非负位数；负位数先缩放到整数再四舍五入
    if (digits < 0) {
      const scale = 10 ** -digits
      const rounded = Number(n($n.div(value, scale)).fixed(0))
      return Number($n.mul(rounded, scale))
    }
    return Number(n(value).fixed(digits))
  }
})

registerFormulaFunction('ABS', {
  minArgs: 1,
  maxArgs: 1,
  meta: { params: ['number'], description: '返回数字的绝对值', category: '数学' },
  impl(args) {
    const value = coerceToNumber(args[0]!)
    if (isFormulaError(value)) return value
    return value < 0 ? Number($n.minus(0, value)) : value
  }
})

registerFormulaFunction('CONCATENATE', {
  minArgs: 1,
  meta: {
    params: ['text1', 'text2', '...'],
    description: '将多个文本连接成一个字符串',
    category: '文本'
  },
  impl(args) {
    let text = ''
    for (const arg of args) {
      const values = Array.isArray(arg) ? arg : [arg]
      for (const value of values) {
        const piece = coerceToText(value)
        if (isFormulaError(piece)) return piece
        text += piece
      }
    }
    return text
  }
})

// ─── 财务函数集（等额年金，Excel 符号约定：收入 pv 为正、付出 pmt 为负）───

/** 每期等额付款额；期数为 0 需除法 → #DIV/0!，结果溢出 → #VALUE! */
function pmtOf(
  rate: number,
  nper: number,
  pv: number,
  fv: number,
  type: boolean
): number | FormulaError {
  let pmt: number
  if (rate === 0) {
    if (nper === 0) return formulaError('#DIV/0!')
    pmt = $n.div($n.minus(0, $n.plus(pv, fv)), nper)
  } else {
    const factor = Math.pow(1 + rate, nper)
    if (factor === 1) return formulaError('#DIV/0!')
    const owed = $n.plus($n.mul(pv, factor), fv)
    pmt = $n.div($n.mul($n.minus(0, owed), rate), $n.minus(factor, 1))
  }
  const out = type ? $n.div(pmt, 1 + rate) : pmt
  return Number.isFinite(out) ? out : formulaError('#VALUE!')
}

/** 年金终值 FV = -(PV·(1+r)^n + PMT·(1+r·type)·((1+r)^n - 1)/r)；r=0 退化为 -(PV + PMT·n) */
function fvOf(
  rate: number,
  nper: number,
  pmt: number,
  pv: number,
  type: boolean
): number | FormulaError {
  const factor = Math.pow(1 + rate, nper)
  const accrual = rate === 0 ? nper : (factor - 1) / rate
  const paid = $n.mul($n.mul(pmt, accrual), type ? 1 + rate : 1)
  const out = $n.minus(0, $n.plus($n.mul(pv, factor), paid))
  return Number.isFinite(out) ? out : formulaError('#VALUE!')
}

/** 年金现值 PV = -(FV + PMT·(1+r·type)·((1+r)^n - 1)/r) / (1+r)^n；r=0 退化为 -(FV + PMT·n) */
function pvOf(
  rate: number,
  nper: number,
  pmt: number,
  fv: number,
  type: boolean
): number | FormulaError {
  const factor = Math.pow(1 + rate, nper)
  if (factor === 0) return formulaError('#DIV/0!')
  const accrual = rate === 0 ? nper : (factor - 1) / rate
  const paid = $n.mul($n.mul(pmt, accrual), type ? 1 + rate : 1)
  const out = $n.div($n.minus(0, $n.plus(fv, paid)), factor)
  return Number.isFinite(out) ? out : formulaError('#VALUE!')
}

/** IPMT / PPMT 共用：参数强转 + per 截断校验（1..nper）+ PMT / 当期利息（错误先行传播） */
function periodParts(args: EvalValue[]): { pmt: number; ipmt: number } | FormulaError {
  const nums = coerceNumberArgs(args, [0, 0, 0, 0, 0, 0])
  if (isFormulaError(nums)) return nums
  const [rate, perRaw, nper, pv, fv, type] = nums as [
    number,
    number,
    number,
    number,
    number,
    number
  ]
  const per = Math.trunc(perRaw)
  if (per < 1 || per > nper) return formulaError('#VALUE!')
  const due = type !== 0
  const pmt = pmtOf(rate, nper, pv, fv, due)
  if (isFormulaError(pmt)) return pmt
  let ipmt: number
  if (per === 1) {
    // 期初付款第 1 期不产生利息
    ipmt = due ? 0 : $n.mul(-pv, rate)
  } else {
    // 利息 = 期初余额 × rate；余额 = -FV(前 per-1 期，期初付款多抵一期)
    const balance = fvOf(rate, per - 1 - (due ? 1 : 0), pmt, pv, due)
    if (isFormulaError(balance)) return balance
    ipmt = $n.mul(balance, rate)
  }
  return { pmt, ipmt }
}

registerFormulaFunction('PMT', {
  minArgs: 3,
  maxArgs: 5,
  meta: {
    params: ['rate', 'nper', 'pv', 'fv', 'type'],
    description: '基于固定利率的等额分期付款额',
    category: '财务'
  },
  impl(args) {
    const nums = coerceNumberArgs(args, [0, 0, 0, 0, 0])
    if (isFormulaError(nums)) return nums
    const [rate, nper, pv, fv, type] = nums as [number, number, number, number, number]
    return pmtOf(rate, nper, pv, fv, type !== 0)
  }
})

registerFormulaFunction('FV', {
  minArgs: 3,
  maxArgs: 5,
  meta: {
    params: ['rate', 'nper', 'pmt', 'pv', 'type'],
    description: '基于固定利率与等额分期付款的年金终值',
    category: '财务'
  },
  impl(args) {
    const nums = coerceNumberArgs(args, [0, 0, 0, 0, 0])
    if (isFormulaError(nums)) return nums
    const [rate, nper, pmt, pv, type] = nums as [number, number, number, number, number]
    return fvOf(rate, nper, pmt, pv, type !== 0)
  }
})

registerFormulaFunction('PV', {
  minArgs: 3,
  maxArgs: 5,
  meta: {
    params: ['rate', 'nper', 'pmt', 'fv', 'type'],
    description: '基于固定利率与等额分期付款的年金现值',
    category: '财务'
  },
  impl(args) {
    const nums = coerceNumberArgs(args, [0, 0, 0, 0, 0])
    if (isFormulaError(nums)) return nums
    const [rate, nper, pmt, fv, type] = nums as [number, number, number, number, number]
    return pvOf(rate, nper, pmt, fv, type !== 0)
  }
})

registerFormulaFunction('IPMT', {
  minArgs: 4,
  maxArgs: 6,
  meta: {
    params: ['rate', 'per', 'nper', 'pv', 'fv', 'type'],
    description: '返回某期付款额中的利息部分',
    category: '财务'
  },
  impl(args) {
    const parts = periodParts(args)
    return isFormulaError(parts) ? parts : parts.ipmt
  }
})

registerFormulaFunction('PPMT', {
  minArgs: 4,
  maxArgs: 6,
  meta: {
    params: ['rate', 'per', 'nper', 'pv', 'fv', 'type'],
    description: '返回某期付款额中的本金部分',
    category: '财务'
  },
  impl(args) {
    const parts = periodParts(args)
    return isFormulaError(parts) ? parts : $n.minus(parts.pmt, parts.ipmt)
  }
})

// ─── 统计扩充函数集（条件统计 / 次序统计）─────────────────────

registerFormulaFunction('COUNTIF', {
  minArgs: 2,
  maxArgs: 2,
  meta: {
    params: ['range', 'criteria'],
    description: '统计区域内满足条件的单元格个数',
    category: '统计'
  },
  impl(args) {
    const criteria = args[1]!
    if (Array.isArray(criteria)) return formulaError('#VALUE!')
    if (isFormulaError(criteria)) return criteria
    const matches = parseCriteria(criteria)
    let count = 0
    for (const { value, fromRange } of flattenArgs([args[0]!])) {
      // 直接错误参数传播；区域内的错误格不参与计数
      if (isFormulaError(value)) {
        if (!fromRange) return value
        continue
      }
      if (matches(value)) count++
    }
    return count
  }
})

registerFormulaFunction('COUNTBLANK', {
  kind: 'lazy',
  minArgs: 1,
  maxArgs: 1,
  meta: { params: ['range'], description: '统计区域内空白单元格的个数', category: '统计' },
  impl(nodes, evalNode) {
    const node = nodes[0]!
    // 区域引用求值只含稀疏存在的格，空白数须按引用节点的几何边界推算
    let total: number
    if (node.kind === 'range') {
      const { start, end } = node.range
      total = (end.row - start.row + 1) * (end.col - start.col + 1)
    } else if (node.kind === 'cell') {
      total = 1
    } else {
      return formulaError('#VALUE!')
    }
    const value = evalNode(node)
    if (isFormulaError(value)) return value
    let nonBlank = 0
    for (const cell of Array.isArray(value) ? value : [value]) {
      // 错误格与空串结果均非空白
      if (isFormulaError(cell) || (cell !== null && cell !== '')) nonBlank++
    }
    return total - nonBlank
  }
})

registerFormulaFunction('MEDIAN', {
  minArgs: 1,
  meta: {
    params: ['number1', 'number2', '...'],
    description: '返回参数的中位数',
    category: '统计'
  },
  impl(args) {
    const numbers = collectNumbers(args)
    if (isFormulaError(numbers)) return numbers
    if (numbers.length === 0) return formulaError('#VALUE!')
    const sorted = [...numbers].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    // 偶数个取中间两数均值（$n 避免浮点误差）
    return sorted.length % 2 ? sorted[mid]! : $n.div($n.plus(sorted[mid - 1]!, sorted[mid]!), 2)
  }
})

/** LARGE / SMALL 共用：第 k 个极值；k 越界（含空集）→ #VALUE! */
function kthExtreme(args: EvalValue[], smallest: boolean): EvalValue {
  const k = coerceToNumber(args[1]!)
  if (isFormulaError(k)) return k
  const numbers = collectNumbers([args[0]!])
  if (isFormulaError(numbers)) return numbers
  const rank = Math.trunc(k)
  if (rank < 1 || rank > numbers.length) return formulaError('#VALUE!')
  const sorted = [...numbers].sort((a, b) => (smallest ? a - b : b - a))
  return sorted[rank - 1]!
}

registerFormulaFunction('LARGE', {
  minArgs: 2,
  maxArgs: 2,
  meta: { params: ['array', 'k'], description: '返回数据集中第 k 个最大值', category: '统计' },
  impl(args) {
    return kthExtreme(args, false)
  }
})

registerFormulaFunction('SMALL', {
  minArgs: 2,
  maxArgs: 2,
  meta: { params: ['array', 'k'], description: '返回数据集中第 k 个最小值', category: '统计' },
  impl(args) {
    return kthExtreme(args, true)
  }
})

registerFormulaFunction('RANK', {
  minArgs: 2,
  maxArgs: 3,
  meta: {
    params: ['number', 'ref', 'order'],
    description: '返回数字在数据集中的名次',
    category: '统计'
  },
  impl(args) {
    const target = coerceToNumber(args[0]!)
    if (isFormulaError(target)) return target
    const numbers = collectNumbers([args[1]!])
    if (isFormulaError(numbers)) return numbers
    let descending = true
    if (args[2] !== undefined) {
      const order = coerceToNumber(args[2])
      if (isFormulaError(order)) return order
      descending = order === 0
    }
    if (!numbers.includes(target)) return formulaError('#N/A')
    // 同值同名次（竞赛排名）：名次 = 1 + 更大（降序）/ 更小（升序）值的个数
    let rank = 1
    for (const num of numbers) {
      if (descending ? num > target : num < target) rank++
    }
    return rank
  }
})

// ─── 逻辑扩充函数集 ───────────────────────────────────────────

registerFormulaFunction('IFERROR', {
  minArgs: 2,
  maxArgs: 2,
  meta: {
    params: ['value', 'value_if_error'],
    description: '首参为任意错误（含 #N/A）时返回替代值',
    category: '逻辑'
  },
  impl(args) {
    return isFormulaError(args[0]) ? args[1]! : args[0]!
  }
})

registerFormulaFunction('TRUE', {
  minArgs: 0,
  maxArgs: 0,
  meta: { params: [], description: '返回逻辑值 TRUE', category: '逻辑' },
  impl: () => true
})

registerFormulaFunction('FALSE', {
  minArgs: 0,
  maxArgs: 0,
  meta: { params: [], description: '返回逻辑值 FALSE', category: '逻辑' },
  impl: () => false
})

registerFormulaFunction('XOR', {
  minArgs: 1,
  meta: {
    params: ['logical1', 'logical2', '...'],
    description: '真值个数为奇数时返回 TRUE',
    category: '逻辑'
  },
  impl(args) {
    const booleans = collectBooleans(args)
    if (isFormulaError(booleans)) return booleans
    if (booleans.length === 0) return formulaError('#VALUE!')
    return booleans.filter(Boolean).length % 2 === 1
  }
})

// ─── 易失性函数集（每次重算都刷新）──────────────────────────────

/**
 * 本地时间 → 1900 系统序列数（含 Lotus 伪闰日修正；整数日为当日 0 点，小数部分为日内时间）。
 * 与 io/import.ts 的 dateToSerial1900 同序列规约，但输入为本地时间（io 侧为 hucre 读回的 UTC 午夜）。
 */
function localDateToSerial1900(date: Date): number {
  const days =
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(1899, 11, 30)) /
    86_400_000
  // serial 60 = 伪 1900-02-29：1900-03-01（days=61）起的日期序列 = 天数差本身
  const serial = days >= 61 ? days : days - 1
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  return serial + (date.getTime() - midnight) / 86_400_000
}

registerFormulaFunction('TODAY', {
  volatile: true,
  minArgs: 0,
  maxArgs: 0,
  meta: { params: [], description: '返回当天日期的序列数', category: '日期与时间' },
  impl: () => Math.floor(localDateToSerial1900(new Date()))
})

registerFormulaFunction('NOW', {
  volatile: true,
  minArgs: 0,
  maxArgs: 0,
  meta: {
    params: [],
    description: '返回当前日期时间的序列数（含时间小数部分）',
    category: '日期与时间'
  },
  impl: () => localDateToSerial1900(new Date())
})

registerFormulaFunction('RAND', {
  volatile: true,
  minArgs: 0,
  maxArgs: 0,
  meta: { params: [], description: '返回 [0, 1) 区间的随机数', category: '数学' },
  impl: () => Math.random()
})

registerFormulaFunction('RANDBETWEEN', {
  volatile: true,
  minArgs: 2,
  maxArgs: 2,
  meta: {
    params: ['bottom', 'top'],
    description: '返回 [bottom, top] 闭区间的随机整数',
    category: '数学'
  },
  impl(args) {
    const bottom = coerceToNumber(args[0]!)
    if (isFormulaError(bottom)) return bottom
    const top = coerceToNumber(args[1]!)
    if (isFormulaError(top)) return top
    if (!Number.isFinite(bottom) || !Number.isFinite(top)) return formulaError('#VALUE!')
    // 非整数参数向零截断（Excel 语义）
    const lo = Math.trunc(bottom)
    const hi = Math.trunc(top)
    if (lo > hi) return formulaError('#VALUE!')
    return lo + Math.floor(Math.random() * (hi - lo + 1))
  }
})

// ─── 查找与引用函数集 ────────────────────────────────────────

/**
 * 查找类函数不走「区域 → 稀疏数组」的参数形态（稀疏数组丢失位置信息），
 * 而是按 lazy 参数的 AST 引用节点取区域几何，经 ctx.readCell 逐格读取
 * （空格为 null，公式格读到实时重算值，错误传播）。
 */

/** 引用参数（cell / range 节点）→ 目标区域（sheet 缺省补公式所在表）；非引用节点 → null */
function referenceArg(
  node: AstNode,
  ctx: FormulaEvalContext
): { sheet: string; range: CellRange } | null {
  if (node.kind === 'cell') {
    return { sheet: node.sheet ?? ctx.currentSheet, range: { start: node.addr, end: node.addr } }
  }
  if (node.kind === 'range') return { sheet: node.sheet ?? ctx.currentSheet, range: node.range }
  return null
}

/** 读取区域首列（column）/ 首行（row）的一维向量，保留位置语义（空格为 null）；错误传播 */
function readVector(
  ctx: FormulaEvalContext,
  sheet: string,
  range: CellRange,
  along: 'column' | 'row'
): ScalarValue[] | FormulaError {
  const values: ScalarValue[] = []
  if (along === 'column') {
    for (let row = range.start.row; row <= range.end.row; row++) {
      const value = ctx.readCell(sheet, { row, col: range.start.col })
      if (isFormulaError(value)) return value
      values.push(value)
    }
  } else {
    for (let col = range.start.col; col <= range.end.col; col++) {
      const value = ctx.readCell(sheet, { row: range.start.row, col })
      if (isFormulaError(value)) return value
      values.push(value)
    }
  }
  return values
}

/** Excel 匹配比较：同类型按类型规则（文本大小写不敏感）；类型不同或含空格 → null（不参与匹配） */
function compareForMatch(left: ScalarValue, right: ScalarValue): number | null {
  if (left === null || right === null || typeof left !== typeof right) return null
  if (typeof left === 'number' && typeof right === 'number') {
    return left < right ? -1 : left > right ? 1 : 0
  }
  if (typeof left === 'string' && typeof right === 'string') {
    const a = left.toUpperCase()
    const b = right.toUpperCase()
    return a < b ? -1 : a > b ? 1 : 0
  }
  if (typeof left === 'boolean' && typeof right === 'boolean') {
    return left === right ? 0 : left ? 1 : -1
  }
  return null
}

/** 精确匹配：首个相等项的 0 基下标，未命中 -1 */
function exactMatchIndex(vector: readonly ScalarValue[], lookup: ScalarValue): number {
  for (let i = 0; i < vector.length; i++) {
    if (compareForMatch(vector[i]!, lookup) === 0) return i
  }
  return -1
}

/** 升序近似：≤ lookup 的最大项的 0 基下标（升序约定下遇首个大于项即停），未命中 -1 */
function ascendingMatchIndex(vector: readonly ScalarValue[], lookup: ScalarValue): number {
  let best = -1
  for (let i = 0; i < vector.length; i++) {
    const cmp = compareForMatch(vector[i]!, lookup)
    if (cmp === null) continue
    if (cmp > 0) break
    best = i
  }
  return best
}

/** 降序近似：≥ lookup 的最小项的 0 基下标（降序约定下遇首个小于项即停），未命中 -1 */
function descendingMatchIndex(vector: readonly ScalarValue[], lookup: ScalarValue): number {
  let best = -1
  for (let i = 0; i < vector.length; i++) {
    const cmp = compareForMatch(vector[i]!, lookup)
    if (cmp === null) continue
    if (cmp < 0) break
    best = i
  }
  return best
}

/** VLOOKUP / HLOOKUP 共用：沿 along 方向扫描首列 / 首行做匹配，取第 index 列 / 行（1 基）的值 */
function vectorLookup(
  nodes: AstNode[],
  evalNode: (node: AstNode) => EvalValue,
  ctx: FormulaEvalContext | undefined,
  along: 'column' | 'row'
): EvalValue {
  if (!ctx) return formulaError('#VALUE!')
  const lookup = evalNode(nodes[0]!)
  if (isFormulaError(lookup)) return lookup
  if (Array.isArray(lookup)) return formulaError('#VALUE!')
  const table = referenceArg(nodes[1]!, ctx)
  if (!table) return formulaError('#VALUE!')
  const indexArg = coerceToNumber(evalNode(nodes[2]!))
  if (isFormulaError(indexArg)) return indexArg
  let exact = false
  if (nodes[3]) {
    const flag = coerceToBoolean(evalNode(nodes[3]))
    if (isFormulaError(flag)) return flag
    exact = !flag
  }
  const { start, end } = table.range
  const span = along === 'column' ? end.col - start.col + 1 : end.row - start.row + 1
  const index = Math.trunc(indexArg)
  if (index < 1) return formulaError('#VALUE!')
  if (index > span) return formulaError('#REF!')
  const vector = readVector(ctx, table.sheet, table.range, along)
  if (isFormulaError(vector)) return vector
  // 空查找值按 0 参与数值匹配（与引擎空格 → 0 的约定一致）
  const key = lookup === null ? 0 : lookup
  const matched = exact ? exactMatchIndex(vector, key) : ascendingMatchIndex(vector, key)
  if (matched < 0) return formulaError('#N/A')
  return along === 'column'
    ? ctx.readCell(table.sheet, { row: start.row + matched, col: start.col + index - 1 })
    : ctx.readCell(table.sheet, { row: start.row + index - 1, col: start.col + matched })
}

registerFormulaFunction('VLOOKUP', {
  kind: 'lazy',
  minArgs: 3,
  maxArgs: 4,
  meta: {
    params: ['lookup_value', 'table_array', 'col_index_num', 'range_lookup'],
    description: '按首列匹配查找值，返回区域内对应行的指定列的值',
    category: '查找与引用'
  },
  impl: (nodes, evalNode, ctx) => vectorLookup(nodes, evalNode, ctx, 'column')
})

registerFormulaFunction('HLOOKUP', {
  kind: 'lazy',
  minArgs: 3,
  maxArgs: 4,
  meta: {
    params: ['lookup_value', 'table_array', 'row_index_num', 'range_lookup'],
    description: '按首行匹配查找值，返回区域内对应列的指定行的值',
    category: '查找与引用'
  },
  impl: (nodes, evalNode, ctx) => vectorLookup(nodes, evalNode, ctx, 'row')
})

registerFormulaFunction('MATCH', {
  kind: 'lazy',
  minArgs: 2,
  maxArgs: 3,
  meta: {
    params: ['lookup_value', 'lookup_array', 'match_type'],
    description: '在一维区域中查找值，返回 1 基相对位置',
    category: '查找与引用'
  },
  impl(nodes, evalNode, ctx) {
    if (!ctx) return formulaError('#VALUE!')
    const lookup = evalNode(nodes[0]!)
    if (isFormulaError(lookup)) return lookup
    if (Array.isArray(lookup)) return formulaError('#VALUE!')
    const arrayRef = referenceArg(nodes[1]!, ctx)
    if (!arrayRef) return formulaError('#VALUE!')
    let matchType = 1
    if (nodes[2]) {
      const typeArg = coerceToNumber(evalNode(nodes[2]))
      if (isFormulaError(typeArg)) return typeArg
      matchType = Math.trunc(typeArg)
    }
    const rows = arrayRef.range.end.row - arrayRef.range.start.row + 1
    const cols = arrayRef.range.end.col - arrayRef.range.start.col + 1
    // 查找区域必须是一维（单行或单列）
    if (rows > 1 && cols > 1) return formulaError('#N/A')
    const vector = readVector(ctx, arrayRef.sheet, arrayRef.range, rows > 1 ? 'column' : 'row')
    if (isFormulaError(vector)) return vector
    const key = lookup === null ? 0 : lookup
    const index =
      matchType === 0
        ? exactMatchIndex(vector, key)
        : matchType > 0
          ? ascendingMatchIndex(vector, key)
          : descendingMatchIndex(vector, key)
    if (index < 0) return formulaError('#N/A')
    return index + 1
  }
})

registerFormulaFunction('INDEX', {
  kind: 'lazy',
  minArgs: 2,
  maxArgs: 3,
  meta: {
    params: ['array', 'row_num', 'column_num'],
    description: '按 1 基行 / 列序号取区域中的值',
    category: '查找与引用'
  },
  impl(nodes, evalNode, ctx) {
    if (!ctx) return formulaError('#VALUE!')
    const ref = referenceArg(nodes[0]!, ctx)
    if (!ref) return formulaError('#VALUE!')
    const rowArg = coerceToNumber(evalNode(nodes[1]!))
    if (isFormulaError(rowArg)) return rowArg
    const rowNum = Math.trunc(rowArg)
    let colNum = 1
    let colGiven = false
    if (nodes[2]) {
      const colArg = coerceToNumber(evalNode(nodes[2]))
      if (isFormulaError(colArg)) return colArg
      colNum = Math.trunc(colArg)
      colGiven = true
    }
    const rows = ref.range.end.row - ref.range.start.row + 1
    const cols = ref.range.end.col - ref.range.start.col + 1
    let row = rowNum
    if (!colGiven) {
      // 单行区域省略列序号时 row_num 实为列序号（Excel 语义）；其余省略取首列
      if (rows === 1 && cols > 1) {
        row = 1
        colNum = rowNum
      } else {
        colNum = 1
      }
    }
    if (row < 1 || colNum < 1) return formulaError('#VALUE!')
    if (row > rows || colNum > cols) return formulaError('#REF!')
    return ctx.readCell(ref.sheet, {
      row: ref.range.start.row + row - 1,
      col: ref.range.start.col + colNum - 1
    })
  }
})

registerFormulaFunction('CHOOSE', {
  kind: 'lazy',
  minArgs: 2,
  meta: {
    params: ['index_num', 'value1', 'value2', '...'],
    description: '按 1 基序号返回第 n 个参数的值',
    category: '查找与引用'
  },
  impl(nodes, evalNode) {
    const indexArg = coerceToNumber(evalNode(nodes[0]!))
    if (isFormulaError(indexArg)) return indexArg
    const index = Math.trunc(indexArg)
    if (index < 1 || index > nodes.length - 1) return formulaError('#VALUE!')
    // 只求值被选中的参数（未选参数的副作用 / 错误不产生，Excel 短路语义）
    return evalNode(nodes[index]!)
  }
})

registerFormulaFunction('ROW', {
  kind: 'lazy',
  minArgs: 0,
  maxArgs: 1,
  meta: {
    params: ['reference'],
    description: '返回引用起始格的行号（省略时取公式所在行，1 基）',
    category: '查找与引用'
  },
  impl(nodes, _evalNode, ctx) {
    if (!ctx) return formulaError('#VALUE!')
    if (nodes.length === 0) return ctx.currentCell.row + 1
    const ref = referenceArg(nodes[0]!, ctx)
    if (!ref) return formulaError('#VALUE!')
    return ref.range.start.row + 1
  }
})

registerFormulaFunction('COLUMN', {
  kind: 'lazy',
  minArgs: 0,
  maxArgs: 1,
  meta: {
    params: ['reference'],
    description: '返回引用起始格的列号（省略时取公式所在列，1 基）',
    category: '查找与引用'
  },
  impl(nodes, _evalNode, ctx) {
    if (!ctx) return formulaError('#VALUE!')
    if (nodes.length === 0) return ctx.currentCell.col + 1
    const ref = referenceArg(nodes[0]!, ctx)
    if (!ref) return formulaError('#VALUE!')
    return ref.range.start.col + 1
  }
})

// ─── 文本函数集 ─────────────────────────────────────────────

registerFormulaFunction('LEN', {
  minArgs: 1,
  maxArgs: 1,
  meta: { params: ['text'], description: '返回文本的字符个数', category: '文本' },
  impl(args) {
    const text = coerceToText(args[0]!)
    if (isFormulaError(text)) return text
    return text.length
  }
})

/** LEFT / RIGHT 共用：count < 0 → #VALUE!；take 从左 / 右取 count 个字符 */
function takeText(text: string, count: number, fromRight: boolean): string {
  if (fromRight) return text.slice(Math.max(0, text.length - count))
  return text.slice(0, count)
}

registerFormulaFunction('LEFT', {
  minArgs: 1,
  maxArgs: 2,
  meta: {
    params: ['text', 'num_chars'],
    description: '返回文本左侧指定个数的字符',
    category: '文本'
  },
  impl(args) {
    const text = coerceToText(args[0]!)
    if (isFormulaError(text)) return text
    let count = 1
    if (args.length > 1) {
      const countArg = coerceToNumber(args[1]!)
      if (isFormulaError(countArg)) return countArg
      count = Math.trunc(countArg)
    }
    if (count < 0) return formulaError('#VALUE!')
    return takeText(text, count, false)
  }
})

registerFormulaFunction('RIGHT', {
  minArgs: 1,
  maxArgs: 2,
  meta: {
    params: ['text', 'num_chars'],
    description: '返回文本右侧指定个数的字符',
    category: '文本'
  },
  impl(args) {
    const text = coerceToText(args[0]!)
    if (isFormulaError(text)) return text
    let count = 1
    if (args.length > 1) {
      const countArg = coerceToNumber(args[1]!)
      if (isFormulaError(countArg)) return countArg
      count = Math.trunc(countArg)
    }
    if (count < 0) return formulaError('#VALUE!')
    return takeText(text, count, true)
  }
})

registerFormulaFunction('MID', {
  minArgs: 3,
  maxArgs: 3,
  meta: {
    params: ['text', 'start_num', 'num_chars'],
    description: '从指定位置起返回指定个数的字符',
    category: '文本'
  },
  impl(args) {
    const text = coerceToText(args[0]!)
    if (isFormulaError(text)) return text
    const startArg = coerceToNumber(args[1]!)
    if (isFormulaError(startArg)) return startArg
    const countArg = coerceToNumber(args[2]!)
    if (isFormulaError(countArg)) return countArg
    const start = Math.trunc(startArg)
    const count = Math.trunc(countArg)
    if (start < 1 || count < 0) return formulaError('#VALUE!')
    return text.slice(start - 1, start - 1 + count)
  }
})

registerFormulaFunction('UPPER', {
  minArgs: 1,
  maxArgs: 1,
  meta: { params: ['text'], description: '将文本转换为大写', category: '文本' },
  impl(args) {
    const text = coerceToText(args[0]!)
    if (isFormulaError(text)) return text
    return text.toUpperCase()
  }
})

registerFormulaFunction('LOWER', {
  minArgs: 1,
  maxArgs: 1,
  meta: { params: ['text'], description: '将文本转换为小写', category: '文本' },
  impl(args) {
    const text = coerceToText(args[0]!)
    if (isFormulaError(text)) return text
    return text.toLowerCase()
  }
})

registerFormulaFunction('TRIM', {
  minArgs: 1,
  maxArgs: 1,
  meta: {
    params: ['text'],
    description: '去除首尾空格并把内部连续空格压缩为一个',
    category: '文本'
  },
  impl(args) {
    const text = coerceToText(args[0]!)
    if (isFormulaError(text)) return text
    return text.replace(/ +/g, ' ').replace(/^ | $/g, '')
  }
})

registerFormulaFunction('EXACT', {
  minArgs: 2,
  maxArgs: 2,
  meta: {
    params: ['text1', 'text2'],
    description: '比较两个文本是否完全相同（区分大小写）',
    category: '文本'
  },
  impl(args) {
    const left = coerceToText(args[0]!)
    if (isFormulaError(left)) return left
    const right = coerceToText(args[1]!)
    if (isFormulaError(right)) return right
    return left === right
  }
})

registerFormulaFunction('SUBSTITUTE', {
  minArgs: 3,
  maxArgs: 4,
  meta: {
    params: ['text', 'old_text', 'new_text', 'instance_num'],
    description: '替换文本中的子串（可指定第几次出现，省略替换全部）',
    category: '文本'
  },
  impl(args) {
    const text = coerceToText(args[0]!)
    if (isFormulaError(text)) return text
    const oldText = coerceToText(args[1]!)
    if (isFormulaError(oldText)) return oldText
    const newText = coerceToText(args[2]!)
    if (isFormulaError(newText)) return newText
    if (oldText === '') return text
    let instance: number | undefined
    if (args.length > 3) {
      const instanceArg = coerceToNumber(args[3]!)
      if (isFormulaError(instanceArg)) return instanceArg
      instance = Math.trunc(instanceArg)
      if (instance < 1) return formulaError('#VALUE!')
    }
    if (instance === undefined) return text.split(oldText).join(newText)
    // 只替换第 instance 次出现（不重叠计数）；出现次数不足则原样返回
    let from = 0
    for (let n = 1; n <= instance; n++) {
      const found = text.indexOf(oldText, from)
      if (found < 0) return text
      if (n === instance) {
        return text.slice(0, found) + newText + text.slice(found + oldText.length)
      }
      from = found + oldText.length
    }
    return text
  }
})

registerFormulaFunction('REPLACE', {
  minArgs: 4,
  maxArgs: 4,
  meta: {
    params: ['old_text', 'start_num', 'num_chars', 'new_text'],
    description: '按字符位置与个数替换文本中的一段',
    category: '文本'
  },
  impl(args) {
    const text = coerceToText(args[0]!)
    if (isFormulaError(text)) return text
    const startArg = coerceToNumber(args[1]!)
    if (isFormulaError(startArg)) return startArg
    const countArg = coerceToNumber(args[2]!)
    if (isFormulaError(countArg)) return countArg
    const newText = coerceToText(args[3]!)
    if (isFormulaError(newText)) return newText
    const start = Math.trunc(startArg)
    const count = Math.trunc(countArg)
    if (start < 1 || count < 0) return formulaError('#VALUE!')
    return text.slice(0, start - 1) + newText + text.slice(start - 1 + count)
  }
})
