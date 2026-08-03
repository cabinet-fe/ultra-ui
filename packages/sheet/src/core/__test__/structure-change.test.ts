import { describe, expect, it } from 'vitest'

import { parseRange } from '../address'
import { DependencyGraph } from '../formula/dependency-graph'
import { Sheet } from '../sheet'

function createSheet(name = 'Sheet1'): Sheet {
  return new Sheet(name)
}

describe('Sheet 行插入', () => {
  it('数据/公式引用/合并/行高整体平移 + 尺寸增长', () => {
    const sheet = createSheet()
    sheet.setCellValue({ row: 0, col: 0 }, 'a')
    sheet.setCellValue({ row: 2, col: 0 }, 'b')
    sheet.setCellFormula({ row: 3, col: 1 }, '=A1+A3')
    sheet.setCellFormula({ row: 4, col: 1 }, '=SUM(A1:A3)')
    sheet.mergeCells(parseRange('B2:C3')!)
    sheet.setRowHeight(5, 40)
    const events: string[] = []
    sheet.on('structure-change', (c) => events.push(c.kind))

    sheet.insertRows(2, 2)

    expect(sheet.getCellData({ row: 4, col: 0 })?.v).toBe('b') // b: row2 → 4
    expect(sheet.getCellData({ row: 5, col: 1 })?.f).toBe('A1+A5') // 公式格 row3 → 5，引用 A3 → A5
    expect(sheet.getCellData({ row: 6, col: 1 })?.f).toBe('SUM(A1:A5)') // 区域扩展
    expect(sheet.merges.getMerges()).toEqual([parseRange('B2:C5')]) // 合并 row1-2 跨插入点 → 扩展
    expect(sheet.getRowHeight(7)).toBe(40) // 行高 row5 → 7
    expect(sheet.rows).toBe(4) // max(0, 2) + 2 = 4
    expect(sheet.cols).toBe(0)
    expect(events).toEqual(['insert-rows'])
  })

  it('插入后公式值正确（重算）', () => {
    const sheet = createSheet()
    sheet.setCellValue({ row: 0, col: 0 }, 10)
    sheet.setCellValue({ row: 2, col: 0 }, 5)
    sheet.setCellFormula({ row: 1, col: 0 }, '=A1+A3')
    expect(sheet.getCellData({ row: 1, col: 0 })?.v).toBe(15)
    sheet.insertRows(1, 1)
    // A1+A3 → A1+A4（原 A3 数据随行下移），值 10+5=15
    expect(sheet.getCellData({ row: 2, col: 0 })?.f).toBe('A1+A4')
    expect(sheet.getCellData({ row: 2, col: 0 })?.v).toBe(15)
  })

  it('undo/redo 往返：数据/公式/合并/行高/尺寸完整还原', () => {
    const sheet = createSheet()
    sheet.setCellValue({ row: 0, col: 0 }, 'a')
    sheet.setCellValue({ row: 2, col: 0 }, 'b')
    sheet.setCellFormula({ row: 1, col: 1 }, '=A1+A3')
    sheet.mergeCells(parseRange('B2:C3')!)
    sheet.setRowHeight(3, 33)
    const snapshotBefore = sheet.snapshot()

    sheet.insertRows(1, 2)
    expect(sheet.getCellData({ row: 4, col: 0 })?.v).toBe('b')
    expect(sheet.rows).toBe(3)

    expect(sheet.undo()).toBe(true)
    expect(sheet.snapshot()).toEqual(snapshotBefore)
    expect(sheet.rows).toBe(0)

    expect(sheet.redo()).toBe(true)
    expect(sheet.getCellData({ row: 4, col: 0 })?.v).toBe('b')
    expect(sheet.rows).toBe(3)
    expect(sheet.getCellData({ row: 3, col: 1 })?.f).toBe('A1+A5')
  })
})

describe('Sheet 行删除', () => {
  it('区间内数据删除、下方上移、公式引用裁剪', () => {
    const sheet = createSheet()
    sheet.setCellValue({ row: 0, col: 0 }, 'a')
    sheet.setCellValue({ row: 3, col: 0 }, 'b')
    sheet.setCellFormula({ row: 4, col: 1 }, '=SUM(A1:A5)')
    sheet.mergeCells(parseRange('B2:D4')!)
    sheet.setRowHeight(4, 44)

    sheet.deleteRows(1, 2) // 删 row1-2

    expect(sheet.getCellData({ row: 1, col: 0 })?.v).toBe('b') // row3 → 1
    expect(sheet.getCellData({ row: 2, col: 1 })?.f).toBe('SUM(A1:A3)') // 区域裁剪
    expect(sheet.merges.getMerges()).toEqual([parseRange('B2:D2')]) // 删 row1-2 → 保留 row3 上移 → row1
    expect(sheet.getRowHeight(2)).toBe(44) // row4 → 2
    expect(sheet.rows).toBe(0) // 未声明尺寸，删除不减
  })

  it('引用被删 → 公式显示 #REF!；undo 恢复', () => {
    const sheet = createSheet()
    sheet.setCellValue({ row: 0, col: 0 }, 10)
    sheet.setCellFormula({ row: 3, col: 0 }, '=A1+A2') // 引用 A2(row1)
    expect(sheet.getCellData({ row: 3, col: 0 })?.v).toBe(10)

    sheet.deleteRows(1, 1) // 删 row1（A2 引用目标）
    expect(sheet.getCellData({ row: 2, col: 0 })?.v).toBe('#REF!') // 公式格 row3 → 2
    expect(sheet.getCellData({ row: 2, col: 0 })?.f).toBeUndefined() // 公式死亡

    sheet.undo()
    expect(sheet.getCellData({ row: 3, col: 0 })?.f).toBe('A1+A2')
    expect(sheet.getCellData({ row: 3, col: 0 })?.v).toBe(10)
  })

  it('引用行被删 → broken #REF! + undo 恢复公式', () => {
    const sheet = createSheet()
    sheet.setCellValue({ row: 0, col: 0 }, 10)
    sheet.setCellValue({ row: 2, col: 0 }, 10)
    sheet.setCellFormula({ row: 3, col: 0 }, '=A1+A3') // 引用 A3(row2)
    expect(sheet.getCellData({ row: 3, col: 0 })?.v).toBe(20)
    sheet.deleteRows(2, 1) // 删 row2（引用目标所在行）

    expect(sheet.getCellData({ row: 2, col: 0 })?.v).toBe('#REF!') // 公式格 row3 → 2
    expect(sheet.getCellData({ row: 2, col: 0 })?.f).toBeUndefined() // 公式死亡

    expect(sheet.undo()).toBe(true)
    expect(sheet.getCellData({ row: 3, col: 0 })?.f).toBe('A1+A3')
    expect(sheet.getCellData({ row: 3, col: 0 })?.v).toBe(20)
  })

  it('合并锚点行被删 → 合并收缩', () => {
    const sheet = createSheet()
    sheet.mergeCells(parseRange('A1:B3')!)
    sheet.deleteRows(0, 1) // 删 row0（锚点行）
    expect(sheet.merges.getMerges()).toEqual([parseRange('A1:B2')]) // 保留 row1-2 上移 → row0-1
  })

  it('undo 后重做，公式引用链完整', () => {
    const sheet = createSheet()
    sheet.setCellValue({ row: 0, col: 0 }, 1)
    sheet.setCellValue({ row: 3, col: 0 }, 2)
    sheet.setCellFormula({ row: 1, col: 0 }, '=A1+A4')
    sheet.deleteRows(2, 1) // 删空行 row2：A1+A4 → A1+A3（引用平移）
    expect(sheet.getCellData({ row: 1, col: 0 })?.f).toBe('A1+A3')
    sheet.undo()
    sheet.redo()
    expect(sheet.getCellData({ row: 1, col: 0 })?.f).toBe('A1+A3')
    expect(sheet.getCellData({ row: 1, col: 0 })?.v).toBe(3)
  })
})

describe('Sheet 列插入/删除', () => {
  it('列插入：数据/公式/合并平移', () => {
    const sheet = createSheet()
    sheet.setCellValue({ row: 0, col: 0 }, 'a')
    sheet.setCellValue({ row: 0, col: 2 }, 'b')
    sheet.setCellFormula({ row: 3, col: 3 }, '=A1+C1')
    sheet.mergeCells(parseRange('B2:D3')!)

    sheet.insertCols(1, 2)

    expect(sheet.getCellData({ row: 0, col: 4 })?.v).toBe('b') // col2 → 4
    expect(sheet.getCellData({ row: 3, col: 5 })?.f).toBe('A1+E1') // C1 → E1
    expect(sheet.merges.getMerges()).toEqual([parseRange('D2:F3')]) // 合并 col1-3 在插入点 → 整体右移
    expect(sheet.cols).toBe(3)
  })

  it('列删除：引用 broken + undo', () => {
    const sheet = createSheet()
    sheet.setCellValue({ row: 0, col: 1 }, 10)
    sheet.setCellValue({ row: 0, col: 2 }, 5)
    sheet.setCellFormula({ row: 0, col: 3 }, '=B1+C1')
    expect(sheet.getCellData({ row: 0, col: 3 })?.v).toBe(15)
    sheet.deleteCols(1, 1) // 删 col1：B1 被删 → #REF!

    expect(sheet.getCellData({ row: 0, col: 2 })?.v).toBe('#REF!')
    expect(sheet.getCellData({ row: 0, col: 2 })?.f).toBeUndefined()

    sheet.undo()
    expect(sheet.getCellData({ row: 0, col: 3 })?.f).toBe('B1+C1')
    expect(sheet.getCellData({ row: 0, col: 3 })?.v).toBe(15)
  })
})

describe('跨表结构变更（共享公式图）', () => {
  it('Sheet1 插行：Sheet2 引用 Sheet1 的公式平移', () => {
    const graph = new DependencyGraph()
    const s1 = new Sheet('Sheet1', graph)
    const s2 = new Sheet('Sheet2', graph)
    s1.setCellValue({ row: 0, col: 0 }, 10)
    s2.setCellFormula({ row: 0, col: 0 }, '=Sheet1!A1+1')
    expect(s2.getCellData({ row: 0, col: 0 })?.v).toBe(11)

    s1.insertRows(0, 2) // Sheet1 首行插 2 行

    expect(s2.getCellData({ row: 0, col: 0 })?.f).toBe('Sheet1!A3+1')
    expect(s2.getCellData({ row: 0, col: 0 })?.v).toBe(11)

    s1.undo()
    expect(s2.getCellData({ row: 0, col: 0 })?.f).toBe('Sheet1!A1+1')
  })

  it('Sheet2 删行覆盖 Sheet1 引用 → Sheet1 公式 #REF!', () => {
    const graph = new DependencyGraph()
    const s1 = new Sheet('Sheet1', graph)
    const s2 = new Sheet('Sheet2', graph)
    s2.setCellValue({ row: 2, col: 0 }, 10)
    s1.setCellFormula({ row: 0, col: 0 }, '=Sheet2!A3*2')
    expect(s1.getCellData({ row: 0, col: 0 })?.v).toBe(20)

    s2.deleteRows(2, 1)

    expect(s1.getCellData({ row: 0, col: 0 })?.v).toBe('#REF!')
    expect(s1.getCellData({ row: 0, col: 0 })?.f).toBeUndefined()

    s2.undo()
    expect(s1.getCellData({ row: 0, col: 0 })?.f).toBe('Sheet2!A3*2')
    expect(s1.getCellData({ row: 0, col: 0 })?.v).toBe(20)
  })
})

describe('结构变更与快照', () => {
  it('rows/cols 随快照持久化与还原', () => {
    const sheet = createSheet()
    sheet.insertRows(0, 3)
    sheet.insertCols(0, 2)
    expect(sheet.rows).toBe(3)
    expect(sheet.cols).toBe(2)
    const snap = sheet.snapshot()
    const restored = createSheet('R')
    restored.restore(snap)
    expect(restored.rows).toBe(3)
    expect(restored.cols).toBe(2)
  })
})

describe('视图声明尺寸（ensureTableSize）', () => {
  it('声明后插入行/列以渲染尺寸为基准增长（回归：插入点小于 props 时尺寸不增长）', () => {
    const sheet = createSheet()
    sheet.ensureTableSize(30, 10) // 视图 props 声明（如 playground 30 行 × A-J 列）
    sheet.insertRows(5, 1)
    expect(sheet.rows).toBe(31) // 修复前为 max(0,5)+1=6，渲染窗口恒 30
    sheet.insertCols(7, 1)
    expect(sheet.cols).toBe(11) // 修复前为 8，A-J 不会多出 H 列
  })

  it('扩张语义：只增大不缩小（不覆盖插入/删除结果）', () => {
    const sheet = createSheet()
    sheet.ensureTableSize(30, 10)
    sheet.insertRows(0, 1)
    expect(sheet.rows).toBe(31)
    sheet.ensureTableSize(30, 10) // grid 重建（tab 切换 / props watch）再次声明
    expect(sheet.rows).toBe(31) // 不被收缩回 30
    sheet.deleteRows(0, 1)
    expect(sheet.rows).toBe(30) // 删除后回 props 基准
    sheet.deleteRows(0, 1)
    expect(sheet.rows).toBe(29) // 继续删除可低于 props（视图由 max(props, rows) 兜底）
  })

  it('undo/redo 往返：尺寸精确还原到声明基准', () => {
    const sheet = createSheet()
    sheet.ensureTableSize(30, 10)
    sheet.insertRows(5, 1)
    sheet.insertCols(7, 1)
    expect(sheet.rows).toBe(31)
    expect(sheet.cols).toBe(11)

    expect(sheet.undo()).toBe(true)
    expect(sheet.rows).toBe(31)
    expect(sheet.cols).toBe(10)

    expect(sheet.undo()).toBe(true)
    expect(sheet.rows).toBe(30)
    expect(sheet.cols).toBe(10)

    expect(sheet.redo()).toBe(true)
    expect(sheet.rows).toBe(31)
    expect(sheet.cols).toBe(10)

    expect(sheet.redo()).toBe(true)
    expect(sheet.rows).toBe(31)
    expect(sheet.cols).toBe(11)
  })

  it('声明尺寸随快照持久化，restore 后视图再次声明不收缩', () => {
    const sheet = createSheet()
    sheet.ensureTableSize(30, 10)
    sheet.insertRows(5, 1)
    const snap = sheet.snapshot()
    expect(snap.rows).toBe(31)

    const restored = createSheet('R')
    restored.restore(snap)
    expect(restored.rows).toBe(31)
    restored.ensureTableSize(30, 10) // 视图挂载兜底
    expect(restored.rows).toBe(31)
  })
})
