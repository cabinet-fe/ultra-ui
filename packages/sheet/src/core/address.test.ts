import { describe, expect, it } from 'vitest'

import {
  boundingBox,
  colIndexToName,
  colNameToIndex,
  formatAddress,
  formatRange,
  iterateRange,
  parseAddress,
  parseRange,
  rangeContainsAddress,
  rangeContainsRange,
  rangesIntersect
} from './address'

describe('colIndexToName / colNameToIndex', () => {
  it('单列名', () => {
    expect(colIndexToName(0)).toBe('A')
    expect(colIndexToName(25)).toBe('Z')
  })

  it('多列名', () => {
    expect(colIndexToName(26)).toBe('AA')
    expect(colIndexToName(27)).toBe('AB')
    expect(colIndexToName(701)).toBe('ZZ')
    expect(colIndexToName(702)).toBe('AAA')
  })

  it('列名转列号', () => {
    expect(colNameToIndex('A')).toBe(0)
    expect(colNameToIndex('Z')).toBe(25)
    expect(colNameToIndex('AA')).toBe(26)
    expect(colNameToIndex('aA')).toBe(26)
    expect(colNameToIndex('1')).toBe(-1)
  })
})

describe('parseAddress / formatAddress', () => {
  it('双向转换', () => {
    const cases: [string, number, number][] = [
      ['A1', 0, 0],
      ['Z99', 98, 25],
      ['AA10', 9, 26]
    ]
    for (const [text, row, col] of cases) {
      expect(parseAddress(text)).toEqual({ row, col })
      expect(formatAddress({ row, col })).toBe(text)
    }
  })

  it('兼容绝对引用', () => {
    expect(parseAddress('$B$2')).toEqual({ row: 1, col: 1 })
  })

  it('非法输入返回 null', () => {
    expect(parseAddress('A0')).toBeNull()
    expect(parseAddress('1A')).toBeNull()
    expect(parseAddress('')).toBeNull()
  })
})

describe('parseRange / formatRange', () => {
  it('解析并规范化角点顺序', () => {
    expect(parseRange('D5:B2')).toEqual({ start: { row: 1, col: 1 }, end: { row: 4, col: 3 } })
  })

  it('单格区域', () => {
    const range = parseRange('B2')
    expect(range).toEqual({ start: { row: 1, col: 1 }, end: { row: 1, col: 1 } })
    expect(formatRange(range!)).toBe('B2')
  })

  it('多格区域格式化', () => {
    expect(formatRange(parseRange('B2:D5')!)).toBe('B2:D5')
  })

  it('非法输入返回 null', () => {
    expect(parseRange('A1:B2:C3')).toBeNull()
    expect(parseRange('A1:')).toBeNull()
  })
})

describe('range 运算', () => {
  const b2c3 = parseRange('B2:C3')!

  it('相交判断', () => {
    expect(rangesIntersect(b2c3, parseRange('C3:D4')!)).toBe(true)
    expect(rangesIntersect(b2c3, parseRange('A1:B1')!)).toBe(false)
    // 相邻但不重叠 → 不相交
    expect(rangesIntersect(b2c3, parseRange('D2:D3')!)).toBe(false)
    expect(rangesIntersect(b2c3, parseRange('B4:C4')!)).toBe(false)
  })

  it('包含判断', () => {
    expect(rangeContainsAddress(b2c3, { row: 2, col: 2 })).toBe(true)
    expect(rangeContainsAddress(b2c3, { row: 3, col: 2 })).toBe(false)
    expect(rangeContainsRange(b2c3, parseRange('B2:B2')!)).toBe(true)
    expect(rangeContainsRange(b2c3, parseRange('B2:D3')!)).toBe(false)
  })

  it('包围盒：跨区域合并场景', () => {
    // 已有 B2:C3，再对 C3:D4 合并 → 包围盒 B2:D4
    const box = boundingBox([parseRange('C3:D4')!, b2c3])
    expect(box).toEqual({ start: { row: 1, col: 1 }, end: { row: 3, col: 3 } })
    expect(formatRange(box)).toBe('B2:D4')
  })

  it('行主序遍历', () => {
    const addrs = [...iterateRange(b2c3)].map(formatAddress)
    expect(addrs).toEqual(['B2', 'C2', 'B3', 'C3'])
  })
})
