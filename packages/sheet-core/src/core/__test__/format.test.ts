import { describe, expect, it } from 'vitest'

import { formatByNumFmt } from '../format'

describe('formatByNumFmt：日期（1900 系统序列数）', () => {
  it('序列数 → YYYY-MM-DD', () => {
    expect(formatByNumFmt(45000, { type: 'date' })).toBe('2023-03-15')
    expect(formatByNumFmt(1, { type: 'date' })).toBe('1900-01-01')
    expect(formatByNumFmt(44927, { type: 'date' })).toBe('2023-01-01')
  })

  it('小数部分为时间，日期格式只取整数日', () => {
    expect(formatByNumFmt(45000.7, { type: 'date' })).toBe('2023-03-15')
  })
})

describe('formatByNumFmt：千分位金额', () => {
  it('整数部分三位分隔，小数部分原样保留', () => {
    expect(formatByNumFmt(1234567.89, { type: 'thousands' })).toBe('1,234,567.89')
    expect(formatByNumFmt(1000, { type: 'thousands' })).toBe('1,000')
    expect(formatByNumFmt(999, { type: 'thousands' })).toBe('999')
    expect(formatByNumFmt(0, { type: 'thousands' })).toBe('0')
  })

  it('负数保留负号', () => {
    expect(formatByNumFmt(-1234.5, { type: 'thousands' })).toBe('-1,234.5')
  })
})

describe('formatByNumFmt：大写金额', () => {
  it('整数 + 角分', () => {
    expect(formatByNumFmt(1234.56, { type: 'cnUpper' })).toBe('壹仟贰佰叁拾肆元伍角陆分')
    expect(formatByNumFmt(10, { type: 'cnUpper' })).toBe('壹拾元整')
    expect(formatByNumFmt(0, { type: 'cnUpper' })).toBe('零元整')
  })

  it('零的收敛：组内零、跨组零、元后零分', () => {
    expect(formatByNumFmt(105, { type: 'cnUpper' })).toBe('壹佰零伍元整')
    expect(formatByNumFmt(10010, { type: 'cnUpper' })).toBe('壹万零壹拾元整')
    expect(formatByNumFmt(100000001, { type: 'cnUpper' })).toBe('壹亿零壹元整')
    expect(formatByNumFmt(100100000, { type: 'cnUpper' })).toBe('壹亿零壹拾万元整')
    expect(formatByNumFmt(1.05, { type: 'cnUpper' })).toBe('壹元零伍分')
  })

  it('纯小数与负数', () => {
    expect(formatByNumFmt(0.5, { type: 'cnUpper' })).toBe('伍角')
    expect(formatByNumFmt(0.05, { type: 'cnUpper' })).toBe('伍分')
    expect(formatByNumFmt(-2.5, { type: 'cnUpper' })).toBe('负贰元伍角')
  })

  it('先四舍五入到分再转换', () => {
    expect(formatByNumFmt(1234.565, { type: 'cnUpper' })).toBe('壹仟贰佰叁拾肆元伍角柒分')
  })
})

describe('formatByNumFmt：小数位数', () => {
  it('四舍五入仅作用于显示（half-up，修正 1.005 浮点误差）', () => {
    expect(formatByNumFmt(1.005, { type: 'fixed', digits: 2 })).toBe('1.01')
    expect(formatByNumFmt(1.004, { type: 'fixed', digits: 2 })).toBe('1.00')
    expect(formatByNumFmt(2, { type: 'fixed', digits: 2 })).toBe('2.00')
    expect(formatByNumFmt(1234.567, { type: 'fixed', digits: 2 })).toBe('1234.57')
  })

  it('0 位与负数', () => {
    expect(formatByNumFmt(1.5, { type: 'fixed', digits: 0 })).toBe('2')
    expect(formatByNumFmt(-1.005, { type: 'fixed', digits: 2 })).toBe('-1.01')
  })
})
