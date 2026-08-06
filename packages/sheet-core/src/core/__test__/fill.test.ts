import { describe, expect, it } from 'vitest'

import { parseRange } from '../address'
import { computeFillTargetRange, generateFill, shiftFormulaRefs } from '../fill'
import { Sheet } from '../sheet'

describe('shiftFormulaRefs', () => {
  it('相对引用随行列位移', () => {
    expect(shiftFormulaRefs('A1+B2', 1, 0)).toBe('A2+B3')
    expect(shiftFormulaRefs('A1+B2', 0, 1)).toBe('B1+C2')
    expect(shiftFormulaRefs('SUM(A1:B2)', 2, 1)).toBe('SUM(B3:C4)')
  })

  it('尊重 $ 绝对行列', () => {
    expect(shiftFormulaRefs('$A$1+A1', 1, 1)).toBe('$A$1+B2')
    expect(shiftFormulaRefs('$A1+A$1', 2, 3)).toBe('$A3+D$1')
    expect(shiftFormulaRefs('Sheet2!$B2+C$3', 1, 1)).toBe('Sheet2!$B3+D$3')
  })

  it('出界变为 #REF!；不改写字符串字面量', () => {
    expect(shiftFormulaRefs('A1', 0, -1)).toBe('#REF!')
    expect(shiftFormulaRefs('A1', -1, 0)).toBe('#REF!')
    expect(shiftFormulaRefs('"A1"&B1', 1, 0)).toBe('"A1"&B2')
    expect(shiftFormulaRefs('LOG10(A1)', 1, 0)).toBe('LOG10(A2)')
  })
})

describe('computeFillTargetRange', () => {
  it('按方向裁剪扩展选区中的新增区域', () => {
    const source = parseRange('A1:B2')!
    expect(computeFillTargetRange(source, 'bottom', parseRange('A1:B5')!)).toEqual(
      parseRange('A3:B5')
    )
    expect(computeFillTargetRange(source, 'right', parseRange('A1:D2')!)).toEqual(
      parseRange('C1:D2')
    )
    expect(computeFillTargetRange(source, 'top', parseRange('A1:B2')!)).toBeNull()
  })
})

describe('generateFill', () => {
  it('非数字 → tile 复制（含空格覆盖清空）', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 0 }, 'a')
    sheet.setCellValue({ row: 1, col: 0 }, 'b')

    const items = generateFill({
      source: parseRange('A1:A2')!,
      target: parseRange('A3:A6')!,
      direction: 'bottom',
      getCellData: (addr) => sheet.getCellData(addr)
    })
    expect(items).toEqual([
      { addr: { row: 2, col: 0 }, data: { v: 'a', t: 's' } },
      { addr: { row: 3, col: 0 }, data: { v: 'b', t: 's' } },
      { addr: { row: 4, col: 0 }, data: { v: 'a', t: 's' } },
      { addr: { row: 5, col: 0 }, data: { v: 'b', t: 's' } }
    ])

    // 空源覆盖：源 B1 空 → 目标格被清
    sheet.setCellValue({ row: 2, col: 1 }, 'keep')
    const clearItems = generateFill({
      source: parseRange('B1')!,
      target: parseRange('B3')!,
      direction: 'bottom',
      getCellData: (addr) => sheet.getCellData(addr)
    })
    expect(clearItems).toEqual([{ addr: { row: 2, col: 1 }, data: undefined }])
  })

  it('数字等差：单格步长 1；多格按 delta 延续', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 0 }, 1)

    const single = generateFill({
      source: parseRange('A1')!,
      target: parseRange('A2:A4')!,
      direction: 'bottom',
      getCellData: (addr) => sheet.getCellData(addr)
    })
    expect(single.map((item) => item.data?.v)).toEqual([2, 3, 4])

    sheet.setCellValue({ row: 0, col: 1 }, 1)
    sheet.setCellValue({ row: 1, col: 1 }, 3)
    const multi = generateFill({
      source: parseRange('B1:B2')!,
      target: parseRange('B3:B4')!,
      direction: 'bottom',
      getCellData: (addr) => sheet.getCellData(addr)
    })
    expect(multi.map((item) => item.data?.v)).toEqual([5, 7])
  })

  it('日期类型（t=d）按数值序列延续', () => {
    const sheet = new Sheet()
    sheet.setCell({ row: 0, col: 0 }, { v: 100, t: 'd' })
    sheet.setCell({ row: 1, col: 0 }, { v: 101, t: 'd' })

    const items = generateFill({
      source: parseRange('A1:A2')!,
      target: parseRange('A3')!,
      direction: 'bottom',
      getCellData: (addr) => sheet.getCellData(addr)
    })
    expect(items).toEqual([{ addr: { row: 2, col: 0 }, data: { v: 102, t: 'd' } }])
  })

  it('公式格：相对引用位移，绝对引用锁定', () => {
    const sheet = new Sheet()
    sheet.setCellFormula({ row: 0, col: 0 }, '=$B$1+C1')

    const items = generateFill({
      source: parseRange('A1')!,
      target: parseRange('A2:A3')!,
      direction: 'bottom',
      getCellData: (addr) => sheet.getCellData(addr)
    })
    expect(items.map((item) => item.data?.f)).toEqual(['$B$1+C2', '$B$1+C3'])
  })

  it('经 setCells 写入后可一次 undo', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 0 }, 10)
    sheet.history.clear()

    const items = generateFill({
      source: parseRange('A1')!,
      target: parseRange('A2:A3')!,
      direction: 'bottom',
      getCellData: (addr) => sheet.getCellData(addr)
    })
    sheet.setCells(items)
    expect(sheet.getCellData({ row: 1, col: 0 })?.v).toBe(11)
    expect(sheet.getCellData({ row: 2, col: 0 })?.v).toBe(12)

    expect(sheet.undo()).toBe(true)
    expect(sheet.getCellData({ row: 1, col: 0 })).toBeUndefined()
    expect(sheet.getCellData({ row: 2, col: 0 })).toBeUndefined()
  })
})
