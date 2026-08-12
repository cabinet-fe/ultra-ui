import type { CellStyle } from '@veltra/sheet-core'
import { mergeCellStyle } from '@veltra/sheet-core/core/command/set-cell-style'

import type { ConditionalRule } from '../types'

/** 条件样式求值上下文：当前展示值 + 可选同记录字段 */
export interface ConditionalEvalContext {
  cellValue: unknown
  bindingField: string
  record?: Record<string, unknown>
}

function ruleScope(rule: ConditionalRule): 'cell' | 'row' {
  return rule.scope ?? 'cell'
}

/** 按规则配置的求值字段从上下文取比较值 */
export function resolveRuleCompareValue(
  ctx: ConditionalEvalContext,
  rule: ConditionalRule
): unknown {
  if (rule.field !== undefined && ctx.record !== undefined) {
    return ctx.record[rule.field]
  }
  return ctx.cellValue
}

/** 将单元格值转为可比较的有限数值；无法转换时返回 null */
export function toComparableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function isBetweenValue(value: unknown): value is [unknown, unknown] {
  return Array.isArray(value) && value.length === 2
}

/**
 * 评估单条条件规则是否命中。
 * 数值比较运算符在双方均可解析为有限数时按数值比较；`eq` 在无法数值化时回退字符串相等。
 */
export function evaluateCondition(cellValue: unknown, rule: ConditionalRule): boolean {
  const { operator, value: ruleValue } = rule

  switch (operator) {
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte':
    case 'eq': {
      const left = toComparableNumber(cellValue)
      const right = toComparableNumber(ruleValue)
      if (left !== null && right !== null) {
        if (operator === 'gt') return left > right
        if (operator === 'gte') return left >= right
        if (operator === 'lt') return left < right
        if (operator === 'lte') return left <= right
        return left === right
      }
      if (operator === 'eq') {
        if (typeof cellValue === 'string' && typeof ruleValue === 'string') {
          return cellValue === ruleValue
        }
        return Object.is(cellValue, ruleValue)
      }
      return false
    }
    case 'between': {
      if (!isBetweenValue(ruleValue)) return false
      const left = toComparableNumber(cellValue)
      const min = toComparableNumber(ruleValue[0])
      const max = toComparableNumber(ruleValue[1])
      if (left === null || min === null || max === null) return false
      return left >= min && left <= max
    }
    case 'contains': {
      if (typeof cellValue !== 'string') return false
      if (typeof ruleValue !== 'string') return false
      return cellValue.includes(ruleValue)
    }
    default:
      return false
  }
}

/**
 * 按规则数组顺序评估条件样式，将命中规则的 style 增量依次合并到 baseStyle。
 * 无规则或未命中时原样返回 baseStyle。
 */
export function evaluateConditionalStyle(
  ctx: ConditionalEvalContext,
  baseStyle: CellStyle | undefined,
  rules: readonly ConditionalRule[] | undefined,
  scope: 'cell' | 'row' = 'cell'
): CellStyle | undefined {
  if (!rules || rules.length === 0) return baseStyle

  let merged = baseStyle
  let matched = false

  for (const rule of rules) {
    if (ruleScope(rule) !== scope) continue
    if (!evaluateCondition(resolveRuleCompareValue(ctx, rule), rule)) continue
    merged = mergeCellStyle(merged, rule.style)
    matched = true
  }

  return matched ? merged : baseStyle
}
