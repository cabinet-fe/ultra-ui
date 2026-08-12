import { describe, expect, it } from 'vitest'

import type { ConditionalRule } from '../../../report/types'
import {
  cloneRulesFromDraft,
  coerceValueForOperator,
  createDraftItem,
  defaultRuleValue,
  initDraftFromRules,
  operatorsForFieldType,
  readBetweenValue,
  resolveEvalFieldType,
  ruleEvalFieldOptions,
  RULE_SCOPE_OPTIONS,
  writeBetweenValue
} from '../designer/conditional-rules/helpers'

describe('conditional-rules helpers', () => {
  it('按字段类型返回运算符列表', () => {
    expect(operatorsForFieldType('number').map((o) => o.value)).toEqual([
      'gt',
      'gte',
      'lt',
      'lte',
      'eq',
      'between'
    ])
    expect(operatorsForFieldType('string').map((o) => o.value)).toEqual(['eq', 'contains'])
  })

  it('运算符切换时重置比较值', () => {
    expect(coerceValueForOperator('between', 'number', 42)).toEqual([0, 100])
    expect(coerceValueForOperator('contains', 'string', 42)).toBe('')
    expect(coerceValueForOperator('gt', 'number', '12')).toBe(12)
  })

  it('between 读写辅助', () => {
    const value = defaultRuleValue('between', 'number')
    expect(readBetweenValue(value, 0, 'number')).toBe(0)
    expect(readBetweenValue(value, 1, 'number')).toBe(100)
    expect(writeBetweenValue(value, 1, 250, 'number')).toEqual([0, 250])
  })

  it('草稿与规则互转保持深拷贝', () => {
    const rules: ConditionalRule[] = [
      { operator: 'gt', value: 10, style: { fill: { color: '#FFCCCC' }, font: { bold: true } } }
    ]
    const draft = initDraftFromRules(rules, 'number')
    expect(draft).toHaveLength(1)

    const cloned = cloneRulesFromDraft(draft)
    expect(cloned[0]).toEqual(rules[0])
    expect(cloned[0]).not.toBe(rules[0])

    draft[0]!.rule.style.fill!.color = '#000000'
    expect(rules[0]!.style.fill!.color).toBe('#FFCCCC')
  })

  it('新建草稿项带默认样式', () => {
    const item = createDraftItem(undefined, 'string')
    expect(item.rule.operator).toBe('eq')
    expect(item.rule.value).toBe('')
    expect(item.rule.style.fill?.color).toBeTruthy()
  })

  it('求值字段与作用范围选项', () => {
    const fields = [
      { name: 'amount', label: '金额', type: 'number' as const },
      { name: 'region', label: '地区', type: 'string' as const }
    ]
    expect(ruleEvalFieldOptions('amount', fields).map((item) => item.label)).toEqual([
      '本格字段',
      '地区'
    ])
    expect(RULE_SCOPE_OPTIONS.map((item) => item.label)).toEqual(['本格', '整行'])
    expect(resolveEvalFieldType({ operator: 'eq', value: '', style: {} }, 'amount', fields)).toBe(
      'number'
    )
    expect(
      resolveEvalFieldType(
        { operator: 'eq', value: '', style: {}, field: 'region' },
        'amount',
        fields
      )
    ).toBe('string')
  })
})
