import { describe, expect, it } from 'vitest'

import {
  evaluateCondition,
  evaluateConditionalStyle,
  resolveRuleCompareValue,
  type ConditionalEvalContext
} from '../rules'
import type { ConditionalRule } from '../types'

function rule(
  operator: ConditionalRule['operator'],
  value: unknown,
  style: ConditionalRule['style'],
  extra?: Partial<ConditionalRule>
): ConditionalRule {
  return { operator, value, style, ...extra }
}

function ctx(
  cellValue: unknown,
  record?: Record<string, unknown>,
  bindingField = 'amount'
): ConditionalEvalContext {
  return { cellValue, bindingField, record }
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

  describe('resolveRuleCompareValue', () => {
    it('缺省 field 时取 cellValue', () => {
      const context = ctx(150, { amount: 150, region: '华东' })
      expect(resolveRuleCompareValue(context, rule('gt', 100, {}))).toBe(150)
    })

    it('指定 field 时取同记录另一字段', () => {
      const context = ctx(150, { amount: 150, region: '华东' })
      expect(resolveRuleCompareValue(context, rule('eq', '华东', {}, { field: 'region' }))).toBe(
        '华东'
      )
    })
  })

  describe('evaluateConditionalStyle', () => {
    const baseStyle = { fill: { color: '#FFFFFF' }, font: { color: '#000000' } }

    it('未命中规则时原样返回 baseStyle', () => {
      const rules = [rule('gt', 1000, { fill: { color: '#FF0000' } })]
      expect(evaluateConditionalStyle(ctx(50), baseStyle, rules)).toBe(baseStyle)
    })

    it('命中单条规则时叠加样式增量', () => {
      const rules = [rule('gt', 100, { fill: { color: '#FFCCCC' }, font: { bold: true } })]
      expect(evaluateConditionalStyle(ctx(150), baseStyle, rules)).toEqual({
        fill: { color: '#FFCCCC' },
        font: { color: '#000000', bold: true }
      })
    })

    it('跨字段求值命中时叠加样式', () => {
      const rules = [rule('eq', '华东', { fill: { color: '#FFCCCC' } }, { field: 'region' })]
      const context = ctx(100, { amount: 100, region: '华东' })
      expect(evaluateConditionalStyle(context, baseStyle, rules)?.fill?.color).toBe('#FFCCCC')
    })

    it('scope: row 仅评估行级规则', () => {
      const rules = [
        rule('gt', 100, { fill: { color: '#FFCCCC' } }, { scope: 'row' }),
        rule('gt', 100, { font: { bold: true } })
      ]
      expect(evaluateConditionalStyle(ctx(150), baseStyle, rules, 'row')?.fill?.color).toBe(
        '#FFCCCC'
      )
      expect(evaluateConditionalStyle(ctx(150), baseStyle, rules, 'cell')?.font?.bold).toBe(true)
      expect(evaluateConditionalStyle(ctx(150), baseStyle, rules, 'cell')?.fill?.color).toBe(
        '#FFFFFF'
      )
    })

    it('多规则按优先级合并，后命中规则覆盖同名字段', () => {
      const rules = [
        rule('gt', 0, { fill: { color: '#FFFFCC' } }),
        rule('gt', 100, { fill: { color: '#FFCCCC' }, font: { bold: true } }),
        rule('gt', 200, { font: { color: '#FF0000' } })
      ]

      const style150 = evaluateConditionalStyle(ctx(150), baseStyle, rules)
      expect(style150?.fill?.color).toBe('#FFCCCC')
      expect(style150?.font).toEqual({ color: '#000000', bold: true })

      const style250 = evaluateConditionalStyle(ctx(250), baseStyle, rules)
      expect(style250?.fill?.color).toBe('#FFCCCC')
      expect(style250?.font).toEqual({ color: '#FF0000', bold: true })
    })

    it('无规则或未传规则时返回 baseStyle', () => {
      expect(evaluateConditionalStyle(ctx(100), baseStyle, undefined)).toBe(baseStyle)
      expect(evaluateConditionalStyle(ctx(100), baseStyle, [])).toBe(baseStyle)
    })
  })
})
