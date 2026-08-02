import type { CellAddress, CellRange } from '../address'
import type { AstNode, BinaryOperator } from './ast'
import { formulaError, isFormulaError, type FormulaError } from './errors'

/**
 * AST 求值器（纯函数，不持有状态；单元格读取经 FormulaEvalContext 注入）。
 *
 * 空格（null）参与运算的规则同 Excel：
 * - 数字上下文按 0（空单元格 +1 = 1）；空字符串字面量参与算术 → #VALUE!
 * - 文本上下文按 ''；布尔上下文按 FALSE
 * - 比较时空格归一为对方类型的零值
 * 错误值遇运算即传播（左操作数优先）。
 */

/** 标量值（单元格/字面量可取的全集；null = 空单元格） */
export type ScalarValue = number | string | boolean | null

/** 求值结果：标量 / 错误 / 区域展开数组（数组仅作为函数参数形态出现） */
export type EvalValue = ScalarValue | FormulaError | (ScalarValue | FormulaError)[]

/** 求值上下文（由依赖图按公式节点注入） */
export interface FormulaEvalContext {
  /** 当前公式所在 sheet（裸引用缺省表） */
  readonly currentSheet: string
  /** 读取单格（原始存储语义；表不存在 → #REF!） */
  readCell(sheet: string, addr: CellAddress): ScalarValue | FormulaError
  /** 读取区域（只含稀疏存在的格；表不存在 → #REF!） */
  readRange(sheet: string, range: CellRange): (ScalarValue | FormulaError)[] | FormulaError
  /** 调用函数（名称未知 → #NAME?；参数个数非法 → #VALUE!） */
  callFunction(name: string, nodes: AstNode[], evalNode: (node: AstNode) => EvalValue): EvalValue
}

const NUMERIC_TEXT_RE = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/

/** 强转数字：null→0，布尔→1/0，数字文本→数字，其余文本→#VALUE!，错误传播 */
export function coerceToNumber(value: EvalValue): number | FormulaError {
  if (isFormulaError(value)) return value
  if (Array.isArray(value)) return formulaError('#VALUE!')
  if (value === null) return 0
  switch (typeof value) {
    case 'number':
      return value
    case 'boolean':
      return value ? 1 : 0
    case 'string': {
      const text = value.trim()
      if (text === '') return formulaError('#VALUE!')
      if (text.toUpperCase() === 'TRUE') return 1
      if (text.toUpperCase() === 'FALSE') return 0
      if (NUMERIC_TEXT_RE.test(text)) return Number.parseFloat(text)
      return formulaError('#VALUE!')
    }
  }
}

/** 强转文本：null→''，布尔→TRUE/FALSE，错误传播 */
export function coerceToText(value: EvalValue): string | FormulaError {
  if (isFormulaError(value)) return value
  if (Array.isArray(value)) return formulaError('#VALUE!')
  if (value === null) return ''
  switch (typeof value) {
    case 'string':
      return value
    case 'number':
      return String(value)
    case 'boolean':
      return value ? 'TRUE' : 'FALSE'
  }
}

/** 强转布尔：null→FALSE，数字≠0，TRUE/FALSE 文本，其余文本→#VALUE!，错误传播 */
export function coerceToBoolean(value: EvalValue): boolean | FormulaError {
  if (isFormulaError(value)) return value
  if (Array.isArray(value)) return formulaError('#VALUE!')
  if (value === null) return false
  switch (typeof value) {
    case 'boolean':
      return value
    case 'number':
      return value !== 0
    case 'string': {
      const text = value.trim().toUpperCase()
      if (text === 'TRUE') return true
      if (text === 'FALSE') return false
      return formulaError('#VALUE!')
    }
  }
}

/** 比较：同类型按类型规则（文本大小写不敏感）；混合类型 数字 < 文本 < 布尔；null 归一为对方零值 */
export function compareScalars(left: ScalarValue, right: ScalarValue): number {
  if (left === null || right === null) {
    if (left === null && right === null) return 0
    if (left === null) return compareScalars(zeroLike(right), right)
    return compareScalars(left, zeroLike(left))
  }
  const leftType = typeof left
  const rightType = typeof right
  if (leftType === 'number' && rightType === 'number') {
    return left < right ? -1 : left > right ? 1 : 0
  }
  if (leftType === 'string' && rightType === 'string') {
    const a = (left as string).toUpperCase()
    const b = (right as string).toUpperCase()
    return a < b ? -1 : a > b ? 1 : 0
  }
  if (leftType === 'boolean' && rightType === 'boolean') {
    return left === right ? 0 : left ? 1 : -1
  }
  return typeRank(leftType) - typeRank(rightType)
}

function zeroLike(value: ScalarValue): ScalarValue {
  if (typeof value === 'number') return 0
  if (typeof value === 'string') return ''
  return false
}

function typeRank(type: string): number {
  if (type === 'number') return 0
  if (type === 'string') return 1
  return 2
}

const COMPARISON_OPS = new Set(['=', '<>', '<', '<=', '>', '>='])

/** AST 求值 */
export function evaluateAst(node: AstNode, ctx: FormulaEvalContext): EvalValue {
  switch (node.kind) {
    case 'number':
    case 'string':
    case 'boolean':
      return node.value
    case 'name':
      return formulaError('#NAME?')
    case 'cell':
      return ctx.readCell(node.sheet ?? ctx.currentSheet, node.addr)
    case 'range':
      return ctx.readRange(node.sheet ?? ctx.currentSheet, node.range)
    case 'unary': {
      const n = coerceToNumber(evaluateAst(node.operand, ctx))
      if (isFormulaError(n)) return n
      return node.op === '-' ? -n : n
    }
    case 'percent': {
      const n = coerceToNumber(evaluateAst(node.operand, ctx))
      if (isFormulaError(n)) return n
      return n / 100
    }
    case 'binary':
      return evaluateBinary(node.op, node.left, node.right, ctx)
    case 'call':
      return ctx.callFunction(node.name, node.args, (arg) => evaluateAst(arg, ctx))
  }
}

function evaluateBinary(
  op: BinaryOperator,
  leftNode: AstNode,
  rightNode: AstNode,
  ctx: FormulaEvalContext
): EvalValue {
  const left = evaluateAst(leftNode, ctx)
  if (isFormulaError(left)) return left
  const right = evaluateAst(rightNode, ctx)
  if (isFormulaError(right)) return right

  if (op === '&') {
    const l = coerceToText(left)
    if (isFormulaError(l)) return l
    const r = coerceToText(right)
    if (isFormulaError(r)) return r
    return l + r
  }

  if (COMPARISON_OPS.has(op)) {
    if (Array.isArray(left) || Array.isArray(right)) return formulaError('#VALUE!')
    const cmp = compareScalars(left, right)
    switch (op) {
      case '=':
        return cmp === 0
      case '<>':
        return cmp !== 0
      case '<':
        return cmp < 0
      case '<=':
        return cmp <= 0
      case '>':
        return cmp > 0
      default:
        return cmp >= 0
    }
  }

  const l = coerceToNumber(left)
  if (isFormulaError(l)) return l
  const r = coerceToNumber(right)
  if (isFormulaError(r)) return r

  switch (op) {
    case '+':
      return l + r
    case '-':
      return l - r
    case '*':
      return l * r
    case '/':
      if (r === 0) return formulaError('#DIV/0!')
      return l / r
    case '^': {
      if (l === 0 && r < 0) return formulaError('#DIV/0!')
      const value = Math.pow(l, r)
      return Number.isFinite(value) ? value : formulaError('#VALUE!')
    }
    // & 与比较运算已在上方提前返回
    default:
      return formulaError('#ERROR!')
  }
}
