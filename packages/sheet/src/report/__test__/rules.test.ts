import { describe, expect, it } from 'vitest'

import { resolveReportRole } from '../binding'
import { evaluateCondition, evaluateConditionalStyle } from '../rules'
import type { ConditionalRule, ReportBinding } from '../types'

function rule(
  operator: ConditionalRule['operator'],
  value: unknown,
  style: ConditionalRule['style']
): ConditionalRule {
  return { operator, value, style }
}

describe('report rules', () => {
  describe('evaluateCondition', () => {
    it('数值比较运算符', () => {
      expect(evaluateCondition(150, rule('gt', 100, {}))).toBe(true)
      expect(evaluateCondition(100, rule('gt', 100, {}))).toBe(false)
      expect(evaluateCondition(100, rule('gte', 100, {}))).toBe(true)
      expect(evaluateCondition(99, rule('lt', 100, {}))).toBe(true)
      expect(evaluateCondition(100, rule('lte', 100, {}))).toBe(true)
      expect(evaluateCondition(42, rule('eq', 42, {}))).toBe(true)
      expect(evaluateCondition('42', rule('eq', 42, {}))).toBe(true)
    })

    it('between 含端点范围比较', () => {
      const between = rule('between', [100, 200], {})
      expect(evaluateCondition(100, between)).toBe(true)
      expect(evaluateCondition(200, between)).toBe(true)
      expect(evaluateCondition(150, between)).toBe(true)
      expect(evaluateCondition(99, between)).toBe(false)
      expect(evaluateCondition(201, between)).toBe(false)
    })

    it('contains 字符串包含', () => {
      expect(evaluateCondition('华东-上海', rule('contains', '上海', {}))).toBe(true)
      expect(evaluateCondition('华北', rule('contains', '上海', {}))).toBe(false)
      expect(evaluateCondition(null, rule('contains', 'x', {}))).toBe(false)
    })

    it('非数值比较在 gt 等运算符下返回 false', () => {
      expect(evaluateCondition('abc', rule('gt', 1, {}))).toBe(false)
    })
  })

  describe('evaluateConditionalStyle', () => {
    const baseStyle = { fill: { color: '#FFFFFF' }, font: { color: '#000000' } }

    it('未命中规则时原样返回 baseStyle', () => {
      const rules = [rule('gt', 1000, { fill: { color: '#FF0000' } })]
      expect(evaluateConditionalStyle(50, baseStyle, rules)).toBe(baseStyle)
    })

    it('命中单条规则时叠加样式增量', () => {
      const rules = [rule('gt', 100, { fill: { color: '#FFCCCC' }, font: { bold: true } })]
      expect(evaluateConditionalStyle(150, baseStyle, rules)).toEqual({
        fill: { color: '#FFCCCC' },
        font: { color: '#000000', bold: true }
      })
    })

    it('多规则按优先级合并，后命中规则覆盖同名字段', () => {
      const rules = [
        rule('gt', 0, { fill: { color: '#FFFFCC' } }),
        rule('gt', 100, { fill: { color: '#FFCCCC' }, font: { bold: true } }),
        rule('gt', 200, { font: { color: '#FF0000' } })
      ]

      const style150 = evaluateConditionalStyle(150, baseStyle, rules)
      expect(style150?.fill?.color).toBe('#FFCCCC')
      expect(style150?.font).toEqual({ color: '#000000', bold: true })

      const style250 = evaluateConditionalStyle(250, baseStyle, rules)
      expect(style250?.fill?.color).toBe('#FFCCCC')
      expect(style250?.font).toEqual({ color: '#FF0000', bold: true })
    })

    it('无规则或未传规则时返回 baseStyle', () => {
      expect(evaluateConditionalStyle(100, baseStyle, undefined)).toBe(baseStyle)
      expect(evaluateConditionalStyle(100, baseStyle, [])).toBe(baseStyle)
    })
  })

  describe('resolveReportRole', () => {
    it('显式 role 优先', () => {
      const binding: ReportBinding = {
        dataset: 'orders',
        field: 'amount',
        role: 'grandTotal',
        aggregate: 'select',
        expand: 'down',
        leftParent: 'default'
      }
      expect(resolveReportRole(binding)).toBe('grandTotal')
    })

    it('旧快照从 aggregate/expand 推导', () => {
      expect(
        resolveReportRole({
          dataset: 'orders',
          field: 'customer',
          aggregate: 'group',
          expand: 'down',
          leftParent: 'none'
        })
      ).toBe('group')

      expect(
        resolveReportRole({
          dataset: 'orders',
          field: 'amount',
          aggregate: 'sum',
          expand: 'none',
          leftParent: 'none'
        })
      ).toBe('subtotal')

      expect(
        resolveReportRole({
          dataset: 'orders',
          field: 'orderNo',
          aggregate: 'select',
          expand: 'down',
          leftParent: 'default'
        })
      ).toBe('detail')
    })
  })
})
