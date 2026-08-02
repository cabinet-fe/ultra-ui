import { describe, expect, it, vi } from 'vitest'

import { parseRange, type CellAddress } from '../address'
import type { CellRange } from '../address'
import type { CellSnapshotItem } from '../cell-store'
import { Sheet } from '../sheet'

const B2 = { row: 1, col: 1 }
const C3 = { row: 2, col: 2 }

/** Sheet 状态快照（cells + merges，排序后比较，与写入顺序无关） */
function snapshotSheet(sheet: Sheet): { cells: CellSnapshotItem[]; merges: CellRange[] } {
  const byAddr = (a: { row: number; col: number }, b: { row: number; col: number }) =>
    a.row - b.row || a.col - b.col
  return {
    cells: [...sheet.store.snapshot()].sort(byAddr),
    merges: sheet.merges.getMerges().sort((a, b) => byAddr(a.start, b.start))
  }
}

/** 生成 100 个连续地址（行主序） */
function hundredAddrs(): CellAddress[] {
  return Array.from({ length: 100 }, (_, i) => ({ row: Math.floor(i / 10), col: i % 10 }))
}

describe('SetCellValueCommand undo/redo', () => {
  it('写入 → undo 删除（旧值为空）→ redo 重放', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 'hello')
    expect(sheet.getCellData(B2)).toEqual({ v: 'hello', t: 's' })

    expect(sheet.undo()).toBe(true)
    // 旧值为空 = 存储中不存在该 key
    expect(sheet.getCellData(B2)).toBeUndefined()
    expect(sheet.store.size).toBe(0)

    expect(sheet.redo()).toBe(true)
    expect(sheet.getCellData(B2)).toEqual({ v: 'hello', t: 's' })
  })

  it('覆盖写入 → undo 恢复旧值 → redo 再到新值', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 'old')
    sheet.setCellValue(B2, 'new')

    sheet.undo()
    expect(sheet.getCellData(B2)).toEqual({ v: 'old', t: 's' })

    sheet.redo()
    expect(sheet.getCellData(B2)).toEqual({ v: 'new', t: 's' })
  })

  it('清除值（null）→ undo 恢复原值', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 42)
    sheet.setCellValue(B2, null)
    expect(sheet.getCellData(B2)).toBeUndefined()

    sheet.undo()
    expect(sheet.getCellData(B2)).toEqual({ v: 42, t: 'n' })
  })

  it('同值写入 = 无实际变更，不产生历史条目', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 'x')
    const depth = sheet.history.undoSize

    sheet.setCellValue(B2, 'x')
    expect(sheet.history.undoSize).toBe(depth)
  })

  it('对被覆盖格写入落锚点 → undo 还原锚点旧值', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 'anchor-old')
    sheet.mergeCells(parseRange('B2:C3')!)

    sheet.setCellValue(C3, 'via-covered')
    expect(sheet.getCellData(B2)).toMatchObject({ v: 'via-covered' })

    sheet.undo()
    expect(sheet.getCellData(B2)).toMatchObject({ v: 'anchor-old' })
    expect(sheet.getCellData(C3)).toBeUndefined()
  })

  it('批量 100 格（setCells 单命令）= 一次 undo 全回滚', () => {
    const sheet = new Sheet()
    const addrs = hundredAddrs()
    sheet.setCells(addrs.map((addr, i) => ({ addr, data: { v: i, t: 'n' as const } })))
    expect(sheet.store.size).toBe(100)
    expect(sheet.history.undoSize).toBe(1)

    expect(sheet.undo()).toBe(true)
    expect(sheet.store.size).toBe(0)

    expect(sheet.redo()).toBe(true)
    expect(sheet.store.size).toBe(100)
    expect(sheet.getCellData({ row: 9, col: 9 })).toEqual({ v: 99, t: 'n' })
  })

  it('事务内 100 次单独写入 = 一次 undo 全回滚（事务原子性）', () => {
    const sheet = new Sheet()
    const addrs = hundredAddrs()

    sheet.beginTransaction()
    for (const [i, addr] of addrs.entries()) {
      sheet.setCellValue(addr, i)
    }
    sheet.commit()

    expect(sheet.store.size).toBe(100)
    expect(sheet.history.undoSize).toBe(1)

    sheet.undo()
    expect(sheet.store.size).toBe(0)
    sheet.redo()
    expect(sheet.store.size).toBe(100)
  })
})

describe('MergeCellsCommand undo/redo', () => {
  it('merge → undo 全还原（合并记录 + 被清空各格原值）→ redo 结果一致', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 'keep')
    sheet.setCellValue(C3, 'drop')
    const before = snapshotSheet(sheet)

    sheet.mergeCells(parseRange('B2:C3')!)
    expect(sheet.getCellInfo(B2).kind).toBe('merged-anchor')
    expect(sheet.getCellData(C3)).toBeUndefined()
    const merged = snapshotSheet(sheet)

    // undo：合并记录移除 + 两格原值全部还原
    sheet.undo()
    expect(sheet.merges.size).toBe(0)
    expect(sheet.getCellData(B2)).toEqual({ v: 'keep', t: 's' })
    expect(sheet.getCellData(C3)).toEqual({ v: 'drop', t: 's' })
    expect(snapshotSheet(sheet)).toEqual(before)

    // redo：再合并结果一致
    sheet.redo()
    expect(snapshotSheet(sheet)).toEqual(merged)
    expect(sheet.getDisplayValue(C3)).toBe('keep')
  })

  it('锚点为空、非锚点格有值：merge 保留值落锚点 → undo 原样还原', () => {
    const sheet = new Sheet()
    sheet.setCellValue(C3, 'first-valued')

    sheet.mergeCells(parseRange('B2:C3')!)
    expect(sheet.getDisplayValue(B2)).toBe('first-valued')
    expect(sheet.getCellData(C3)).toBeUndefined()

    sheet.undo()
    expect(sheet.getCellData(B2)).toBeUndefined()
    expect(sheet.getCellData(C3)).toEqual({ v: 'first-valued', t: 's' })
    expect(sheet.merges.size).toBe(0)
  })

  it('合并已合并区域（包围盒扩大）→ 两次 undo 逐步还原', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 'v-b2')
    sheet.mergeCells(parseRange('B2:C3')!)
    sheet.setCellValue({ row: 3, col: 3 }, 'v-d4')
    const afterFirstMerge = snapshotSheet(sheet)

    // 再合并 C3:D4 → 包围盒 B2:D4，旧合并 B2:C3 被解除
    const finalRange = sheet.mergeCells(parseRange('C3:D4')!)
    expect(finalRange).toEqual(parseRange('B2:D4'))
    expect(sheet.getCellData({ row: 3, col: 3 })).toBeUndefined()

    // 第一次 undo：恢复旧合并 B2:C3 + 被清空的 D4 原值
    sheet.undo()
    expect(snapshotSheet(sheet)).toEqual(afterFirstMerge)
    expect(sheet.getCellInfo(B2).mergeRange).toEqual(parseRange('B2:C3'))
    expect(sheet.getCellData({ row: 3, col: 3 })).toEqual({ v: 'v-d4', t: 's' })

    // 第二次 undo：撤销 setCellValue(D4)
    sheet.undo()
    expect(sheet.getCellData({ row: 3, col: 3 })).toBeUndefined()
    expect(sheet.merges.size).toBe(1)

    // 第三次 undo：连第一个合并也还原
    sheet.undo()
    expect(sheet.merges.size).toBe(0)
    expect(sheet.getCellData(B2)).toEqual({ v: 'v-b2', t: 's' })
  })
})

describe('UnmergeCellsCommand undo/redo', () => {
  it('unmerge → undo 恢复合并记录 → redo 再解除', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 'keep')
    sheet.mergeCells(parseRange('B2:C3')!)

    sheet.unmergeCells(parseRange('B2:C3')!)
    expect(sheet.merges.size).toBe(0)
    expect(sheet.getCellData(B2)).toMatchObject({ v: 'keep' })

    sheet.undo()
    expect(sheet.merges.size).toBe(1)
    expect(sheet.getCellInfo(C3).kind).toBe('merged-covered')
    expect(sheet.getDisplayValue(C3)).toBe('keep')

    sheet.redo()
    expect(sheet.merges.size).toBe(0)
  })

  it('unmerge 无相交合并 = 空操作，不入历史', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 'x')
    const depth = sheet.history.undoSize

    sheet.unmergeCells(parseRange('D4:E5')!)
    expect(sheet.history.undoSize).toBe(depth)
  })
})

describe('历史栈语义（经 Sheet）', () => {
  it('空栈 undo/redo 返回 false', () => {
    const sheet = new Sheet()
    expect(sheet.canUndo).toBe(false)
    expect(sheet.canRedo).toBe(false)
    expect(sheet.undo()).toBe(false)
    expect(sheet.redo()).toBe(false)
  })

  it('交错序列：A → B → undo → 新 C → redo 栈已清空', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 0 }, 'A')
    sheet.setCellValue({ row: 0, col: 1 }, 'B')

    sheet.undo()
    expect(sheet.canRedo).toBe(true)

    sheet.setCellValue({ row: 0, col: 2 }, 'C')
    expect(sheet.canRedo).toBe(false)
    expect(sheet.redo()).toBe(false)
    // B 永远丢失，A/C 保留
    expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'A' })
    expect(sheet.getCellData({ row: 0, col: 1 })).toBeUndefined()
    expect(sheet.getCellData({ row: 0, col: 2 })).toMatchObject({ v: 'C' })
  })

  it('容量上限：超过 200 条淘汰最旧，且不破坏栈一致性', () => {
    const sheet = new Sheet()
    // 201 次写入到不同格（第 0 次将被淘汰）
    for (let i = 0; i <= 200; i++) {
      sheet.setCellValue({ row: 0, col: i }, i)
    }
    expect(sheet.history.undoSize).toBe(200)

    // 只能 undo 最近 200 条；最旧一条（col 0）已被淘汰
    for (let i = 0; i < 200; i++) {
      expect(sheet.undo()).toBe(true)
    }
    expect(sheet.undo()).toBe(false)
    expect(sheet.getCellData({ row: 0, col: 0 })).toEqual({ v: 0, t: 'n' })
    expect(sheet.getCellData({ row: 0, col: 1 })).toBeUndefined()

    // redo 栈一致：200 条全部可重做
    for (let i = 0; i < 200; i++) {
      expect(sheet.redo()).toBe(true)
    }
    expect(sheet.redo()).toBe(false)
    expect(sheet.store.size).toBe(201)
  })

  it('快速连续 undo/redo 50 次无状态错乱', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 0 }, 'a')
    sheet.setCellValue(B2, 'b')
    sheet.mergeCells(parseRange('C3:D4')!)
    const initial = snapshotSheet(sheet)
    // 以当前状态为历史起点（排除上述准备操作）
    sheet.history.clear()

    // 10 步操作
    for (let i = 0; i < 10; i++) {
      sheet.setCellValue({ row: 5, col: i }, i)
    }
    const afterOps = snapshotSheet(sheet)

    // 交替 undo/redo 各 25 次（每对 undo+redo 应回到同一状态）
    for (let i = 0; i < 25; i++) {
      sheet.undo()
      sheet.redo()
    }
    expect(snapshotSheet(sheet)).toEqual(afterOps)

    // 连续 50 次 undo（10 步有效 + 40 步空转）→ 回到初始
    for (let i = 0; i < 50; i++) sheet.undo()
    expect(snapshotSheet(sheet)).toEqual(initial)

    // 连续 50 次 redo（10 步有效 + 40 步空转）→ 回到操作后
    for (let i = 0; i < 50; i++) sheet.redo()
    expect(snapshotSheet(sheet)).toEqual(afterOps)
  })

  it('history-change 事件携带 canUndo/canRedo', () => {
    const sheet = new Sheet()
    const handler = vi.fn()
    sheet.on('history-change', handler)

    sheet.setCellValue(B2, 'x')
    expect(handler).toHaveBeenLastCalledWith({ canUndo: true, canRedo: false })

    sheet.undo()
    expect(handler).toHaveBeenLastCalledWith({ canUndo: false, canRedo: true })

    sheet.redo()
    expect(handler).toHaveBeenLastCalledWith({ canUndo: true, canRedo: false })
  })

  it('嵌套事务拍平为一个 undo 单元', () => {
    const sheet = new Sheet()
    sheet.beginTransaction()
    sheet.setCellValue({ row: 0, col: 0 }, 'a')
    sheet.beginTransaction()
    sheet.setCellValue({ row: 0, col: 1 }, 'b')
    sheet.commit()
    sheet.commit()

    expect(sheet.history.undoSize).toBe(1)
    sheet.undo()
    expect(sheet.store.size).toBe(0)
  })

  it('事务中途异常：rollback 还原模型且不入历史', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 0 }, 'before')
    const depth = sheet.history.undoSize

    sheet.beginTransaction()
    sheet.setCellValue({ row: 0, col: 1 }, 'tx-a')
    sheet.setCellValue({ row: 0, col: 2 }, 'tx-b')
    sheet.rollback()

    expect(sheet.getCellData({ row: 0, col: 1 })).toBeUndefined()
    expect(sheet.getCellData({ row: 0, col: 2 })).toBeUndefined()
    expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'before' })
    expect(sheet.history.undoSize).toBe(depth)
    expect(sheet.history.inTransaction).toBe(false)
  })

  it('事务进行中 undo/redo 返回 false', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 0 }, 'a')
    sheet.beginTransaction()
    sheet.setCellValue({ row: 0, col: 1 }, 'b')

    expect(sheet.undo()).toBe(false)
    expect(sheet.redo()).toBe(false)
    expect(sheet.getCellData({ row: 0, col: 1 })).toMatchObject({ v: 'b' })
    sheet.commit()
  })

  it('undo 后选区不被历史追踪，且不崩溃、可继续正常选中', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 'keep')
    sheet.mergeCells(parseRange('B2:C3')!)
    sheet.selectCell(C3)
    expect(sheet.getSelection().activeCell).toEqual(B2)

    // undo 解除合并；选区保持原样（选区不进历史）
    sheet.undo()
    expect(sheet.getSelection().activeCell).toEqual(B2)

    // 合并已解除，C3 现在是普通格
    sheet.selectCell(C3)
    expect(sheet.getSelection().activeCell).toEqual(C3)

    // redo 重新合并后，C3 又解析到锚点
    sheet.redo()
    sheet.selectCell(C3)
    expect(sheet.getSelection().activeCell).toEqual(B2)
  })
})
