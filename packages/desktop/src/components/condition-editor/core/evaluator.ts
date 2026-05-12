import type { ConditionExpression, ConditionGroup, ConditionItem } from '../../../types'

function resolveValue(item: ConditionItem, data: Record<string, unknown>): string {
  if (item.value.kind === 'constant') return item.value.value
  return String(getByPath(data, item.value.name) ?? '')
}

function resolveCompareValue(item: ConditionItem, data: Record<string, unknown>): string {
  if (item.value.kind === 'constant') return item.value.value
  return String(getByPath(data, item.value.name) ?? '')
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: any, key) => (acc != null ? acc[key] : undefined), obj)
}

function evaluateItem(item: ConditionItem, data: Record<string, unknown>): boolean {
  const resolved = resolveValue(item, data)
  const compareValue = resolveCompareValue(item, data)

  switch (item.operator) {
    case 'empty':
      return resolved === '' || resolved === 'undefined' || resolved === 'null'
    case 'not_empty':
      return resolved !== '' && resolved !== 'undefined' && resolved !== 'null'
    case 'is_true':
      return resolved === 'true' || resolved === '1'
    case 'is_false':
      return resolved === 'false' || resolved === '0' || resolved === ''
    case 'eq':
      return resolved === compareValue
    case 'ne':
      return resolved !== compareValue
    case 'contains':
      return resolved.includes(compareValue)
    case 'not_contains':
      return !resolved.includes(compareValue)
    case 'gt':
      return Number(resolved) > Number(compareValue)
    case 'lt':
      return Number(resolved) < Number(compareValue)
    case 'gte':
      return Number(resolved) >= Number(compareValue)
    case 'lte':
      return Number(resolved) <= Number(compareValue)
    case 'before':
      return new Date(resolved).getTime() < new Date(compareValue).getTime()
    case 'after':
      return new Date(resolved).getTime() > new Date(compareValue).getTime()
    case 'in': {
      const vals = compareValue.split(',').map((s) => s.trim())
      return vals.includes(resolved)
    }
    default:
      return false
  }
}

function evaluateGroup(group: ConditionGroup, data: Record<string, unknown>): boolean {
  const conditionsResult = group.conditions.map((item) => {
    const result = evaluateItem(item, data)
    item._result = result
    return result
  })

  const groupsResult = group.groups.map((sub) => {
    const result = evaluateGroup(sub, data)
    sub._result = result
    return result
  })

  const allResults = [...conditionsResult, ...groupsResult]
  if (allResults.length === 0) return false

  return group.logic === 'and' ? allResults.every(Boolean) : allResults.some(Boolean)
}

export function evaluate(
  expression: ConditionExpression,
  data: Record<string, unknown>
): ConditionExpression {
  const cloned = JSON.parse(JSON.stringify(expression)) as ConditionExpression
  evaluateGroup(cloned, data)
  return cloned
}

export function createEmptyGroup(): ConditionGroup {
  return { logic: 'and', conditions: [], groups: [] }
}

export function createEmptyItem(): ConditionItem {
  return { field: '', operator: 'eq', value: { kind: 'constant', value: '' } }
}
