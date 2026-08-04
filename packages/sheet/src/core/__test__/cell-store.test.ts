import { describe, expect, it } from 'vitest'

import { CellStore, inferCellType, isEmptyCellData, normalizeInputValue } from '../cell-store'

describe('CellData 类型判别', () => {
  it('按值推断类型', () => {
    expect(inferCellType(42)).toBe('n')
    expect(inferCellType('hello')).toBe('s')
    expect(inferCellType(true)).toBe('b')
    expect(inferCellType(null)).toBeUndefined()
  })

  it('normalizeInputValue：数字/布尔文本规范化，撇号强制文本', () => {
    expect(normalizeInputValue('10')).toBe(10)
    expect(normalizeInputValue('  -3.5  ')).toBe(-3.5)
    expect(normalizeInputValue('1e2')).toBe(100)
    expect(normalizeInputValue('TRUE')).toBe(true)
    expect(normalizeInputValue('false')).toBe(false)
    expect(normalizeInputValue("'10")).toBe('10')
    expect(normalizeInputValue('hello')).toBe('hello')
    expect(normalizeInputValue(42)).toBe(42)
  })

  it('写入读出保持类型；数字文本写入为 number', () => {
    const store = new CellStore()
    store.setCellValue({ row: 0, col: 0 }, 42)
    store.setCellValue({ row: 0, col: 1 }, 'hello')
    store.setCellValue({ row: 0, col: 2 }, true)
    store.setCellValue({ row: 0, col: 3 }, '10')

    expect(store.getCell({ row: 0, col: 0 })).toEqual({ v: 42, t: 'n' })
    expect(store.getCell({ row: 0, col: 1 })).toEqual({ v: 'hello', t: 's' })
    expect(store.getCell({ row: 0, col: 2 })).toEqual({ v: true, t: 'b' })
    expect(store.getCell({ row: 0, col: 3 })).toEqual({ v: 10, t: 'n' })
  })

  it('空数据判定', () => {
    expect(isEmptyCellData(undefined)).toBe(true)
    expect(isEmptyCellData({})).toBe(true)
    expect(isEmptyCellData({ v: null })).toBe(true)
    expect(isEmptyCellData({ v: '' })).toBe(true)
    expect(isEmptyCellData({ v: 0 })).toBe(false)
    expect(isEmptyCellData({ f: 'SUM(A1:B2)' })).toBe(false)
  })
})

describe('稀疏性', () => {
  it('空值写入即删除', () => {
    const store = new CellStore()
    const addr = { row: 0, col: 0 }
    store.setCellValue(addr, 1)
    expect(store.size).toBe(1)

    store.setCellValue(addr, null)
    expect(store.size).toBe(0)
    expect(store.getCell(addr)).toBeUndefined()

    store.setCellValue(addr, 'x')
    store.setCellValue(addr, '')
    expect(store.size).toBe(0)

    store.setCell(addr, { v: 1 })
    store.setCell(addr, {})
    expect(store.size).toBe(0)
  })

  it('store 大小不随行列数增长', () => {
    const store = new CellStore()
    store.setCellValue({ row: 99_999, col: 100 }, 'sparse')
    expect(store.rowCount).toBe(100_000)
    expect(store.colCount).toBe(101)
    expect(store.size).toBe(1)
  })

  it('10⁵ 行高水位 + 200 个真实格：迭代与序列化只含 200 格', () => {
    const store = new CellStore()
    store.setCellValue({ row: 99_999, col: 0 }, 'tail')
    for (let i = 0; i < 199; i++) {
      store.setCellValue({ row: i, col: 0 }, i)
    }

    expect(store.rowCount).toBe(100_000)
    expect([...store.entries()]).toHaveLength(200)
    expect(store.snapshot()).toHaveLength(200)
  })
})

describe('snapshot / restore', () => {
  it('往返一致并重算高水位', () => {
    const store = new CellStore()
    store.setCellValue({ row: 0, col: 0 }, 1)
    store.setCell({ row: 2, col: 3 }, { v: 'x', f: 'A1' })

    const restored = new CellStore()
    restored.restore(store.snapshot())

    expect(restored.getCell({ row: 0, col: 0 })).toEqual({ v: 1, t: 'n' })
    expect(restored.getCell({ row: 2, col: 3 })).toEqual({ v: 'x', f: 'A1' })
    expect(restored.rowCount).toBe(3)
    expect(restored.colCount).toBe(4)
  })

  it('读取返回副本，外部修改不影响存储', () => {
    const store = new CellStore()
    store.setCell({ row: 0, col: 0 }, { v: 1 })
    const data = store.getCell({ row: 0, col: 0 })!
    data.v = 999
    expect(store.getCell({ row: 0, col: 0 })!.v).toBe(1)
  })
})
