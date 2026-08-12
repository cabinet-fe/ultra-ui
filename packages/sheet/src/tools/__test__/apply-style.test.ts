import { createRange } from '@veltra/sheet-core/core/address'
import { Sheet } from '@veltra/sheet-core/core/sheet'
import { describe, expect, it } from 'vitest'

import { classifySelectionStyleTarget, type SelectionStyleTarget } from '../apply-style'
import { createSheetContext } from '../context'

describe('classifySelectionStyleTarget', () => {
  const cases: Array<{
    name: string
    range: ReturnType<typeof createRange>
    rows: number
    cols: number
    expected: SelectionStyleTarget
  }> = [
    {
      name: '整行（行号选区）',
      range: createRange({ row: 2, col: 0 }, { row: 2, col: 25 }),
      rows: 100,
      cols: 26,
      expected: 'row'
    },
    {
      name: '多行整行',
      range: createRange({ row: 1, col: 0 }, { row: 3, col: 25 }),
      rows: 100,
      cols: 26,
      expected: 'row'
    },
    {
      name: '整列（列头选区）',
      range: createRange({ row: 0, col: 4 }, { row: 99, col: 4 }),
      rows: 100,
      cols: 26,
      expected: 'col'
    },
    {
      name: '局部区域',
      range: createRange({ row: 0, col: 0 }, { row: 2, col: 2 }),
      rows: 100,
      cols: 26,
      expected: 'cell'
    },
    {
      name: '全表（行列皆满）→ 格样式',
      range: createRange({ row: 0, col: 0 }, { row: 99, col: 25 }),
      rows: 100,
      cols: 26,
      expected: 'cell'
    }
  ]

  for (const c of cases) {
    it(c.name, () => {
      expect(classifySelectionStyleTarget(c.range, c.rows, c.cols)).toBe(c.expected)
    })
  }
})

describe('SheetContext.applyStyle', () => {
  it('无 resolveGridSize：一律 setCellStyle', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const range = createRange({ row: 0, col: 0 }, { row: 0, col: 25 })
    ctx.applyStyle(range, { fill: { color: '#FF0000' } })
    expect(sheet.getRowStyle(0)).toBeUndefined()
    expect(sheet.getCellStyle({ row: 0, col: 0 })).toEqual({ fill: { color: '#FF0000' } })
    expect(sheet.getCellStyle({ row: 0, col: 25 })).toEqual({ fill: { color: '#FF0000' } })
  })

  it('整行选区 → setRowStyle；插列后新空格继承填充', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet, undefined, {
      resolveGridSize: () => ({ rows: 100, cols: 26 })
    })
    const range = createRange({ row: 1, col: 0 }, { row: 1, col: 25 })
    ctx.applyStyle(range, { fill: { color: '#AABBCC' } })

    expect(sheet.getRowStyle(1)).toEqual({ fill: { color: '#AABBCC' } })
    // 不物化逐格样式
    expect(sheet.getCellStyle({ row: 1, col: 0 })).toBeUndefined()
    expect(sheet.getEffectiveStyle({ row: 1, col: 10 })).toEqual({ fill: { color: '#AABBCC' } })

    sheet.insertCols(0, 1)
    expect(sheet.getEffectiveStyle({ row: 1, col: 0 })).toEqual({ fill: { color: '#AABBCC' } })
    expect(sheet.getEffectiveStyle({ row: 1, col: 26 })).toEqual({ fill: { color: '#AABBCC' } })
  })

  it('整列选区 → setColStyle；插行后新空格继承', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet, undefined, {
      resolveGridSize: () => ({ rows: 50, cols: 10 })
    })
    const range = createRange({ row: 0, col: 2 }, { row: 49, col: 2 })
    ctx.applyStyle(range, { font: { bold: true } })

    expect(sheet.getColStyle(2)).toEqual({ font: { bold: true } })
    expect(sheet.getCellStyle({ row: 0, col: 2 })).toBeUndefined()
    expect(sheet.getEffectiveStyle({ row: 20, col: 2 })).toEqual({ font: { bold: true } })

    sheet.insertRows(0, 1)
    expect(sheet.getEffectiveStyle({ row: 0, col: 2 })).toEqual({ font: { bold: true } })
  })

  it('局部选区仍走 setCellStyle', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet, undefined, {
      resolveGridSize: () => ({ rows: 100, cols: 26 })
    })
    const range = createRange({ row: 0, col: 0 }, { row: 0, col: 1 })
    ctx.applyStyle(range, { fill: { color: '#112233' } })
    expect(sheet.getRowStyle(0)).toBeUndefined()
    expect(sheet.getCellStyle({ row: 0, col: 0 })).toEqual({ fill: { color: '#112233' } })
    expect(sheet.getCellStyle({ row: 0, col: 1 })).toEqual({ fill: { color: '#112233' } })
  })

  it('applyStyle 整行写入进 undo', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet, undefined, {
      resolveGridSize: () => ({ rows: 100, cols: 26 })
    })
    ctx.applyStyle(createRange({ row: 0, col: 0 }, { row: 0, col: 25 }), {
      fill: { color: '#00FF00' }
    })
    expect(sheet.getRowStyle(0)).toBeDefined()
    expect(ctx.undo()).toBe(true)
    expect(sheet.getRowStyle(0)).toBeUndefined()
  })
})
