import { o } from '@cat-kit/core'

import type {
  ConditionConnector,
  ConditionExpression,
  ConditionField,
  ConditionGroup,
  ConditionLeaf,
  ConditionNode,
  ConditionValue
} from '../../../types'

export interface EvaluateOptions {
  /** 字段定义 —— 提供后按字段类型做类型感知比较 */
  fields?: ConditionField[]
  /** 上下文数据，用于解析 `kind: 'variable'` 引用 */
  data?: Record<string, unknown>
}

/**
 * 求值表达式
 *
 * - 纯函数，不修改入参
 * - 空表达式（无任何叶子节点）返回 `true`（视作"无限制"）
 * - 不完整的叶子（field/operator 缺失、或缺少所需值且 operator 需要值）按 `false` 计
 * - 同组内 AND/OR 按 **从左到右、等优先级** 求值；需要更高优先级请用子分组
 */
export function evaluate(expression: ConditionExpression, options: EvaluateOptions = {}): boolean {
  return evaluateGroup(expression, options)
}

function evaluateGroup(group: ConditionGroup, options: EvaluateOptions): boolean {
  const { children, connectors } = group
  if (children.length === 0) return true

  let acc = evaluateNode(children[0]!, options)
  for (let i = 1; i < children.length; i++) {
    const connector: ConditionConnector = connectors[i - 1] ?? 'and'
    const current = evaluateNode(children[i]!, options)
    acc = connector === 'and' ? acc && current : acc || current
  }
  return acc
}

function evaluateNode(node: ConditionNode, options: EvaluateOptions): boolean {
  return node.type === 'group' ? evaluateGroup(node, options) : evaluateLeaf(node, options)
}

function evaluateLeaf(leaf: ConditionLeaf, options: EvaluateOptions): boolean {
  if (!leaf.field || !leaf.operator) return false
  const field = options.fields?.find((f) => f.value === leaf.field)
  const left = readField(leaf.field, options.data)
  const op = leaf.operator

  if (op === 'empty') return isEmpty(left)
  if (op === 'not_empty') return !isEmpty(left)
  if (op === 'is_true') return toBool(left) === true
  if (op === 'is_false') return toBool(left) === false

  // 其余 operator 需要一个右侧比较值
  if (!isValueProvided(leaf.value)) return false
  const right = resolveValue(leaf.value, options.data)

  const fieldType = field?.type ?? 'string'

  switch (op) {
    case 'eq':
      return compareEq(left, right, fieldType)
    case 'ne':
      return !compareEq(left, right, fieldType)
    case 'contains':
      return toStr(left).includes(toStr(right))
    case 'not_contains':
      return !toStr(left).includes(toStr(right))
    case 'gt':
      return toNumber(left) > toNumber(right)
    case 'lt':
      return toNumber(left) < toNumber(right)
    case 'gte':
      return toNumber(left) >= toNumber(right)
    case 'lte':
      return toNumber(left) <= toNumber(right)
    case 'before':
      return toTime(left) < toTime(right)
    case 'after':
      return toTime(left) > toTime(right)
    case 'in': {
      // 右侧可能是数组、逗号分隔字符串或单值
      const list = Array.isArray(right)
        ? right.map(toStr)
        : toStr(right)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
      return list.includes(toStr(left))
    }
    default:
      return false
  }
}

function readField(path: string, data?: Record<string, unknown>): unknown {
  if (!data) return undefined
  return o(data).get(path)
}

function resolveValue(value: ConditionValue, data?: Record<string, unknown>): unknown {
  if (value.kind === 'constant') return value.value
  return readField(value.name, data)
}

function isValueProvided(value: ConditionValue): boolean {
  if (value.kind === 'constant') return value.value !== ''
  return value.name !== ''
}

function isEmpty(v: unknown): boolean {
  if (v == null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  return false
}

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (s === 'true' || s === '1') return true
    if (s === 'false' || s === '0' || s === '') return false
  }
  return Boolean(v)
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isNaN(n) ? Number.NaN : n
  }
  return Number.NaN
}

function toTime(v: unknown): number {
  if (v instanceof Date) return v.getTime()
  if (typeof v === 'number') return v
  if (typeof v === 'string' && v) return new Date(v).getTime()
  return Number.NaN
}

function compareEq(left: unknown, right: unknown, type: ConditionField['type']): boolean {
  if (type === 'number') return toNumber(left) === toNumber(right)
  if (type === 'boolean') return toBool(left) === toBool(right)
  if (type === 'date') return toTime(left) === toTime(right)
  return toStr(left) === toStr(right)
}

function toStr(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v)
  if (v instanceof Date) return v.toISOString()
  try {
    return JSON.stringify(v)
  } catch {
    return ''
  }
}

// ── 工厂 ─────────────────────────────────────────

export function createEmptyGroup(): ConditionGroup {
  return { type: 'group', children: [], connectors: [] }
}

export function createEmptyLeaf(): ConditionLeaf {
  return { type: 'condition', field: '', operator: 'eq', value: { kind: 'constant', value: '' } }
}
