import type { ConditionalOperator, ConditionalRule, DatasetField } from '@veltra/sheet'

export interface DraftRuleItem {
  id: string
  rule: ConditionalRule
}

export const OPERATOR_LABELS: Record<ConditionalOperator, string> = {
  gt: '大于',
  gte: '大于等于',
  lt: '小于',
  lte: '小于等于',
  eq: '等于',
  between: '介于',
  contains: '包含'
}

const NUMERIC_OPERATORS: ConditionalOperator[] = ['gt', 'gte', 'lt', 'lte', 'eq', 'between']
const STRING_OPERATORS: ConditionalOperator[] = ['eq', 'contains']

let draftIdSeq = 0

function nextDraftId(): string {
  draftIdSeq += 1
  return `rule-${draftIdSeq}`
}

/** 按字段类型返回可用运算符 */
export function operatorsForFieldType(
  fieldType: DatasetField['type']
): Array<{ value: ConditionalOperator; label: string }> {
  const ops = fieldType === 'string' ? STRING_OPERATORS : NUMERIC_OPERATORS
  return ops.map((value) => ({ value, label: OPERATOR_LABELS[value] }))
}

export function isNumericFieldType(fieldType: DatasetField['type']): boolean {
  return fieldType === 'number' || fieldType === 'date'
}

export function defaultRuleValue(
  operator: ConditionalOperator,
  fieldType: DatasetField['type']
): unknown {
  if (operator === 'between') {
    return isNumericFieldType(fieldType) ? [0, 100] : ['', '']
  }
  if (operator === 'contains' || (operator === 'eq' && fieldType === 'string')) {
    return ''
  }
  return 0
}

export function defaultRuleStyle(): ConditionalRule['style'] {
  return { fill: { color: '#FEE2E2' }, font: { color: '#DC2626' } }
}

export function createDraftItem(
  rule?: ConditionalRule,
  fieldType: DatasetField['type'] = 'number'
): DraftRuleItem {
  if (rule) {
    return { id: nextDraftId(), rule: cloneRule(rule) }
  }
  const operator = operatorsForFieldType(fieldType)[0]?.value ?? 'eq'
  return {
    id: nextDraftId(),
    rule: { operator, value: defaultRuleValue(operator, fieldType), style: defaultRuleStyle() }
  }
}

export function initDraftFromRules(
  rules: readonly ConditionalRule[],
  fieldType: DatasetField['type']
): DraftRuleItem[] {
  if (rules.length === 0) return []
  return rules.map((rule) => createDraftItem(rule, fieldType))
}

export function cloneRule(rule: ConditionalRule): ConditionalRule {
  return {
    operator: rule.operator,
    value: cloneRuleValue(rule.value),
    style: {
      ...rule.style,
      fill: rule.style.fill ? { ...rule.style.fill } : undefined,
      font: rule.style.font ? { ...rule.style.font } : undefined
    }
  }
}

function cloneRuleValue(value: unknown): unknown {
  if (Array.isArray(value)) return [...value]
  return value
}

export function cloneRulesFromDraft(items: readonly DraftRuleItem[]): ConditionalRule[] {
  return items.map((item) => cloneRule(item.rule))
}

/** 运算符切换时重置比较值为合理缺省 */
export function coerceValueForOperator(
  operator: ConditionalOperator,
  fieldType: DatasetField['type'],
  current: unknown
): unknown {
  if (operator === 'between') {
    if (Array.isArray(current) && current.length === 2) return [...current]
    return defaultRuleValue('between', fieldType)
  }
  if (operator === 'contains') {
    return typeof current === 'string' ? current : ''
  }
  if (isNumericFieldType(fieldType)) {
    const n = typeof current === 'number' && Number.isFinite(current) ? current : Number(current)
    return Number.isFinite(n) ? n : 0
  }
  return typeof current === 'string' ? current : ''
}

function toDisplayString(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value)
  }
  return ''
}

export function readBetweenValue(
  value: unknown,
  index: 0 | 1,
  fieldType: DatasetField['type']
): number | string {
  const pair =
    Array.isArray(value) && value.length === 2 ? value : defaultRuleValue('between', fieldType)
  const raw = (pair as [unknown, unknown])[index]
  if (isNumericFieldType(fieldType)) {
    const n = typeof raw === 'number' ? raw : Number(raw)
    return Number.isFinite(n) ? n : 0
  }
  return typeof raw === 'string' ? raw : toDisplayString(raw)
}

export function writeBetweenValue(
  value: unknown,
  index: 0 | 1,
  next: number | string,
  fieldType: DatasetField['type']
): [unknown, unknown] {
  const current = readBetweenValue(value, 0, fieldType)
  const currentEnd = readBetweenValue(value, 1, fieldType)
  const pair: [unknown, unknown] = [current, currentEnd]
  pair[index] = next
  return pair
}
