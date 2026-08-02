import type { AstNode } from './ast'
import { formulaError, isFormulaError, type FormulaError } from './errors'
import {
  coerceToBoolean,
  coerceToNumber,
  coerceToText,
  type EvalValue,
  type ScalarValue
} from './evaluator'

/**
 * 函数注册表（可扩展）+ 基础函数集。
 *
 * 参数形态约定：区域引用求值为数组（只含稀疏存在的格），直接参数为标量。
 * 聚合函数据此区分 Excel 语义：区域内的文本/布尔被忽略，直接参数则强转（非法 → #VALUE!）。
 * lazy 函数自行求值参数（IF 的短路分支，未选分支的副作用/错误不产生）。
 */

export type FormulaFunction =
  | { kind?: 'normal'; minArgs?: number; maxArgs?: number; impl: (args: EvalValue[]) => EvalValue }
  | {
      kind: 'lazy'
      minArgs?: number
      maxArgs?: number
      impl: (nodes: AstNode[], evalNode: (node: AstNode) => EvalValue) => EvalValue
    }

const registry = new Map<string, FormulaFunction>()

/** 注册函数（名称大小写不敏感；同名覆盖，供扩展/自定义函数） */
export function registerFormulaFunction(name: string, def: FormulaFunction): void {
  registry.set(name.toUpperCase(), def)
}

/** 查询函数（大小写不敏感） */
export function getFormulaFunction(name: string): FormulaFunction | undefined {
  return registry.get(name.toUpperCase())
}

/** 求值器回调：名称解析 + 参数个数校验 + 按 kind 分发 */
export function invokeFormulaFunction(
  name: string,
  nodes: AstNode[],
  evalNode: (node: AstNode) => EvalValue
): EvalValue {
  const def = getFormulaFunction(name)
  if (!def) return formulaError('#NAME?')
  if (def.minArgs !== undefined && nodes.length < def.minArgs) return formulaError('#VALUE!')
  if (def.maxArgs !== undefined && nodes.length > def.maxArgs) return formulaError('#VALUE!')
  if (def.kind === 'lazy') return def.impl(nodes, evalNode)
  return def.impl(nodes.map(evalNode))
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
    const n = coerceToNumber(value)
    if (isFormulaError(n)) return n
    numbers.push(n)
  }
  return numbers
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

// ─── 基础函数集 ─────────────────────────────────────────────

registerFormulaFunction('SUM', {
  minArgs: 1,
  impl(args) {
    const numbers = collectNumbers(args)
    if (isFormulaError(numbers)) return numbers
    let sum = 0
    for (const n of numbers) sum += n
    return sum
  }
})

registerFormulaFunction('AVERAGE', {
  minArgs: 1,
  impl(args) {
    const numbers = collectNumbers(args)
    if (isFormulaError(numbers)) return numbers
    if (numbers.length === 0) return formulaError('#DIV/0!')
    let sum = 0
    for (const n of numbers) sum += n
    return sum / numbers.length
  }
})

registerFormulaFunction('MAX', {
  minArgs: 1,
  impl(args) {
    const numbers = collectNumbers(args)
    if (isFormulaError(numbers)) return numbers
    return numbers.length === 0 ? 0 : Math.max(...numbers)
  }
})

registerFormulaFunction('MIN', {
  minArgs: 1,
  impl(args) {
    const numbers = collectNumbers(args)
    if (isFormulaError(numbers)) return numbers
    return numbers.length === 0 ? 0 : Math.min(...numbers)
  }
})

registerFormulaFunction('COUNT', {
  minArgs: 1,
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
  impl(nodes, evalNode) {
    const cond = coerceToBoolean(evalNode(nodes[0]!))
    if (isFormulaError(cond)) return cond
    if (cond) return evalNode(nodes[1]!)
    return nodes[2] ? evalNode(nodes[2]) : false
  }
})

registerFormulaFunction('AND', {
  minArgs: 1,
  impl(args) {
    const booleans = collectBooleans(args)
    if (isFormulaError(booleans)) return booleans
    if (booleans.length === 0) return formulaError('#VALUE!')
    return booleans.every(Boolean)
  }
})

registerFormulaFunction('OR', {
  minArgs: 1,
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
  impl(args) {
    const b = coerceToBoolean(args[0]!)
    if (isFormulaError(b)) return b
    return !b
  }
})

registerFormulaFunction('ROUND', {
  minArgs: 2,
  maxArgs: 2,
  impl(args) {
    const n = coerceToNumber(args[0]!)
    if (isFormulaError(n)) return n
    const d = coerceToNumber(args[1]!)
    if (isFormulaError(d)) return d
    const factor = 10 ** Math.trunc(d)
    // 位数超出 double 精度时四舍五入是恒等/归零
    if (!Number.isFinite(factor)) return n
    if (factor === 0) return 0
    // 远离零方向取整；1e-12 补偿浮点表示误差（如 2.675 存为 2.67499…）
    const shifted = n * factor
    const rounded = Math.sign(shifted) * Math.round(Math.abs(shifted) + 1e-12)
    return rounded / factor
  }
})

registerFormulaFunction('ABS', {
  minArgs: 1,
  maxArgs: 1,
  impl(args) {
    const n = coerceToNumber(args[0]!)
    if (isFormulaError(n)) return n
    return Math.abs(n)
  }
})

registerFormulaFunction('CONCATENATE', {
  minArgs: 1,
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
