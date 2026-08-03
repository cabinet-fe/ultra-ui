import { describe, expect, it } from 'vitest'

import { parseRange } from '../address'
import { CellStore } from '../cell-store'
import { MergeManager } from '../merge-manager'

describe('CellStore 行列平移', () => {
  function seeded(): CellStore {
    const store = new CellStore()
    store.setCellValue({ row: 0, col: 0 }, 'a')
    store.setCellValue({ row: 2, col: 1 }, 'b')
    store.setCellValue({ row: 5, col: 3 }, 'c')
    return store
  }

  it('insertRows：插入点及之后的行整体下移，高水位重算', () => {
    const store = seeded()
    store.insertRows(2, 2)
    expect(store.getCell({ row: 0, col: 0 })?.v).toBe('a')
    expect(store.getCell({ row: 2, col: 1 })?.v).toBeUndefined()
    expect(store.getCell({ row: 4, col: 1 })?.v).toBe('b')
    expect(store.getCell({ row: 7, col: 3 })?.v).toBe('c')
    expect(store.rowCount).toBe(8)
    expect(store.colCount).toBe(4)
  })

  it('insertRows 首行插入：全部下移', () => {
    const store = seeded()
    store.insertRows(0, 1)
    expect(store.getCell({ row: 1, col: 0 })?.v).toBe('a')
    expect(store.getCell({ row: 3, col: 1 })?.v).toBe('b')
    expect(store.rowCount).toBe(7)
  })

  it('insertRows 表尾插入：无数据受影响，高水位不变', () => {
    const store = seeded()
    store.insertRows(10, 3)
    expect(store.getCell({ row: 5, col: 3 })?.v).toBe('c')
    expect(store.rowCount).toBe(6)
  })

  it('deleteRows：区间内移除、之后上移、高水位收缩', () => {
    const store = seeded()
    store.deleteRows(1, 2) // 删 1-2 行
    expect(store.getCell({ row: 0, col: 0 })?.v).toBe('a')
    expect(store.getCell({ row: 1, col: 1 })?.v).toBeUndefined()
    expect(store.getCell({ row: 3, col: 3 })?.v).toBe('c') // 原 5 行 → 3
    expect(store.rowCount).toBe(4)
  })

  it('deleteRows 删除含数据行：数据移除', () => {
    const store = seeded()
    store.deleteRows(2, 1)
    expect(store.getCell({ row: 2, col: 1 })?.v).toBeUndefined()
    expect(store.getCell({ row: 4, col: 3 })?.v).toBe('c')
    expect(store.rowCount).toBe(5)
  })

  it('deleteRows 尾部删除：仅收缩高水位', () => {
    const store = seeded()
    store.deleteRows(4, 3)
    expect(store.getCell({ row: 2, col: 1 })?.v).toBe('b')
    expect(store.rowCount).toBe(3)
    expect(store.colCount).toBe(2)
  })

  it('insertCols / deleteCols：列轴平移与删除', () => {
    const store = seeded()
    store.insertCols(1, 2)
    expect(store.getCell({ row: 0, col: 0 })?.v).toBe('a')
    expect(store.getCell({ row: 2, col: 3 })?.v).toBe('b') // col1 → 3
    expect(store.getCell({ row: 5, col: 5 })?.v).toBe('c') // col3 → 5
    expect(store.colCount).toBe(6)
    store.deleteCols(4, 1) // 删 col4：b(2,3) 保留，c(5,5) → 4
    expect(store.getCell({ row: 2, col: 3 })?.v).toBe('b')
    expect(store.getCell({ row: 5, col: 4 })?.v).toBe('c')
    expect(store.colCount).toBe(5)
  })

  it('deleteCols：区间内列移除', () => {
    const store = seeded()
    store.deleteCols(1, 2) // 删 col1-2：b(2,1) 被删，c(5,3) → 1
    expect(store.getCell({ row: 2, col: 1 })?.v).toBeUndefined()
    expect(store.getCell({ row: 5, col: 1 })?.v).toBe('c')
    expect(store.colCount).toBe(2)
  })

  it('插入后再次删除还原坐标（往返一致性，按坐标排序比较）', () => {
    const store = seeded()
    const before = store.snapshot().sort((a, b) => a.row - b.row || a.col - b.col)
    store.insertRows(2, 3)
    store.deleteRows(2, 3)
    const after = store.snapshot().sort((a, b) => a.row - b.row || a.col - b.col)
    expect(after).toEqual(before)
  })
})

describe('MergeManager 行列平移与裁剪', () => {
  function seeded(): MergeManager {
    const m = new MergeManager()
    m.addMerge(parseRange('B2:D4')!) // 锚点 row1 col1，区域 row1-3 col1-3
    m.addMerge(parseRange('E6:F7')!) // 锚点 row5 col4，区域 row5-6 col4-5
    return m
  }

  it('shiftRowsInsert：合并下方的整体下移', () => {
    const m = seeded()
    m.shiftRowsInsert(4, 2) // 在 row4 前插入：B2:D4 之上不动；E6:F7 下移
    expect(m.getMerges()).toEqual([parseRange('B2:D4'), parseRange('E8:F9')])
  })

  it('shiftRowsInsert：插入点位于合并内部 → 高度扩展', () => {
    const m = seeded()
    m.shiftRowsInsert(2, 1) // 在 row2 前插入：B2:D4 扩展为 B2:D5；E6:F7 下移
    expect(m.getMerges()).toEqual([parseRange('B2:D5'), parseRange('E7:F8')])
  })

  it('shiftRowsInsert：插入点在锚点行 → 整体下移', () => {
    const m = seeded()
    m.shiftRowsInsert(1, 2) // 在 row1 前插入：B2:D4 整体下移
    expect(m.getMerges()).toEqual([parseRange('B4:D6'), parseRange('E8:F9')])
  })

  it('shiftColsInsert：内部扩展 + 下方平移', () => {
    const m = seeded()
    m.shiftColsInsert(2, 1) // 在 col2 前插入：B2:D4 扩展为 B2:E4；E6:F7 右移
    expect(m.getMerges()).toEqual([parseRange('B2:E4'), parseRange('F6:G7')])
  })

  it('shiftRowsDelete：区间下方整体上移', () => {
    const m = seeded()
    m.shiftRowsDelete(7, 1) // 删除 row7：两个合并在上方，不动
    expect(m.getMerges()).toEqual([parseRange('B2:D4'), parseRange('E6:F7')])
    m.shiftRowsDelete(6, 1) // 删 row6：E6:F7 完全在下方（start.row 5 < 6 相交？end.row 6 在区间 → 收缩为 E6:F6）
    // 上方不动；E6:F7 的 row6 被删 → 保留 row5 → E6:F6
    expect(m.getMerges()).toEqual([parseRange('B2:D4'), parseRange('E6:F6')])
  })

  it('shiftRowsDelete：完全在区间内的合并移除', () => {
    const m = seeded()
    m.shiftRowsDelete(1, 3) // 删 row1-3：B2:D4 完全在内移除；E6:F7 上移 3 → E3:F4
    expect(m.getMerges()).toEqual([parseRange('E3:F4')])
  })

  it('shiftRowsDelete：锚点在区间内 → 收缩（Excel 语义），下方合并上移', () => {
    const m = seeded()
    m.shiftRowsDelete(1, 2) // 删 row1-2：B2:D4 锚点被删 → 保留 row3 上移填补 → B2:D2；E6:F7 上移 2 → E4:F5
    expect(m.getMerges()).toEqual([parseRange('B2:D2'), parseRange('E4:F5')])
  })

  it('shiftRowsDelete：部分裁剪（锚点保留）+ 下方上移', () => {
    const m = seeded()
    m.shiftRowsDelete(3, 2) // 删 row3-4：B2:D4 保留 row1-2 → B2:D3；E6:F7 上移 2 → E4:F5
    expect(m.getMerges()).toEqual([parseRange('B2:D3'), parseRange('E4:F5')])
  })

  it('shiftRowsDelete：锚点上方 + 下方同时保留（中间被删）', () => {
    const m = new MergeManager()
    m.addMerge(parseRange('A1:E5')!)
    m.shiftRowsDelete(2, 2) // 删 row2-3：保留 row0-1 + row4 → 3 行 → A1:E3
    expect(m.getMerges()).toEqual([parseRange('A1:E3')])
  })

  it('shiftRowsDelete：裁剪后只剩 1 行保留', () => {
    const m = new MergeManager()
    m.addMerge(parseRange('A1:C2')!)
    m.shiftRowsDelete(1, 5) // 删 row1 起：保留 row0 → A1:C1
    expect(m.getMerges()).toEqual([parseRange('A1:C1')])
  })

  it('shiftColsDelete：列轴裁剪与平移', () => {
    const m = seeded()
    m.shiftColsDelete(2, 2) // 删 col2-3：B2:D4 保留 col1 → B2:B4；E6:F7 左移 2 → C6:D7
    expect(m.getMerges()).toEqual([parseRange('B2:B4'), parseRange('C6:D7')])
  })

  it('平移后 coverIndex 保持一致性（被覆盖格仍解析到锚点）', () => {
    const m = seeded()
    m.shiftRowsInsert(3, 2) // B2:D4 扩展为 B2:D6；E6:F7 下移为 E8:F9
    expect(m.getMerges()).toEqual([parseRange('B2:D6'), parseRange('E8:F9')])
    expect(m.resolveAnchor({ row: 3, col: 2 })).toEqual({ row: 1, col: 1 }) // B2:D6 覆盖格 → 锚点
    expect(m.resolveAnchor({ row: 8, col: 5 })).toEqual({ row: 7, col: 4 }) // E8:F9 覆盖格 → 锚点
    m.shiftRowsDelete(3, 2) // 还原：B2:D6 删 row3-4 → B2:D4；E8:F9 上移 → E6:F7
    expect(m.getMerges()).toEqual([parseRange('B2:D4'), parseRange('E6:F7')])
    expect(m.resolveAnchor({ row: 3, col: 2 })).toEqual({ row: 1, col: 1 })
    expect(m.resolveAnchor({ row: 6, col: 5 })).toEqual({ row: 5, col: 4 })
    // 平移后无残留索引：被覆盖格解析不越界
    expect(m.resolveAnchor({ row: 4, col: 3 })).toEqual({ row: 4, col: 3 })
  })
})
