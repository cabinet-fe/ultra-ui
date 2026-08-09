import { describe, expect, it } from 'vitest'

import {
  parseDateRangeValue,
  patchParamValues,
  resolveNumberParamValue
} from '../filter-bar-helpers'

describe('parseDateRangeValue', () => {
  it('解析数组形式的日期范围', () => {
    expect(parseDateRangeValue(['2024-01-01', '2024-12-31'])).toEqual(['2024-01-01', '2024-12-31'])
  })

  it('解析 from/to 对象形式', () => {
    expect(parseDateRangeValue({ from: '2024-03-01', to: '2024-03-31' })).toEqual([
      '2024-03-01',
      '2024-03-31'
    ])
  })

  it('解析 start/end 对象形式', () => {
    expect(parseDateRangeValue({ start: '2024-06-01', end: '2024-06-30' })).toEqual([
      '2024-06-01',
      '2024-06-30'
    ])
  })

  it('空值回退为空字符串元组', () => {
    expect(parseDateRangeValue(undefined)).toEqual(['', ''])
    expect(parseDateRangeValue(null)).toEqual(['', ''])
    expect(parseDateRangeValue('')).toEqual(['', ''])
  })
})

describe('resolveNumberParamValue', () => {
  it('保留有限数字', () => {
    expect(resolveNumberParamValue(42)).toBe(42)
    expect(resolveNumberParamValue('12.5')).toBe(12.5)
  })

  it('空值与非法值返回 undefined', () => {
    expect(resolveNumberParamValue('')).toBeUndefined()
    expect(resolveNumberParamValue(null)).toBeUndefined()
    expect(resolveNumberParamValue(undefined)).toBeUndefined()
    expect(resolveNumberParamValue('abc')).toBeUndefined()
  })
})

describe('patchParamValues', () => {
  it('合并单参数变更且保留其余值', () => {
    const next = patchParamValues({ region: '华东', qty: 10 }, 'region', '华南')
    expect(next).toEqual({ region: '华南', qty: 10 })
  })

  it('支持 date-range 元组写入', () => {
    const next = patchParamValues({ dateRange: ['2024-01-01', '2024-01-31'] }, 'dateRange', [
      '2024-02-01',
      '2024-02-28'
    ])
    expect(next.dateRange).toEqual(['2024-02-01', '2024-02-28'])
  })
})
