import { describe, expect, it } from 'vitest'

import type { SheetSnapshot } from '../sheet'
import { Sheet } from '../sheet'

describe('Sheet Cell Meta：设置 / 读取 / 清除', () => {
  it('setCellMeta / getCellMeta 按地址与 namespace 存取', () => {
    const sheet = new Sheet()
    const addr = { row: 1, col: 2 }
    const payload = { binding: 'orders.amount', aggregate: 'list' }

    sheet.setCellMeta(addr, 'report', payload)

    expect(sheet.getCellMeta(addr, 'report')).toEqual(payload)
    expect(sheet.getCellMeta(addr, 'other')).toBeUndefined()
    expect(sheet.getCellMeta({ row: 0, col: 0 }, 'report')).toBeUndefined()
  })

  it('clearCellMeta 移除指定 namespace；其他 namespace 保留', () => {
    const sheet = new Sheet()
    const addr = { row: 0, col: 0 }
    sheet.setCellMeta(addr, 'report', { a: 1 })
    sheet.setCellMeta(addr, 'note', 'hello')

    sheet.clearCellMeta(addr, 'report')

    expect(sheet.getCellMeta(addr, 'report')).toBeUndefined()
    expect(sheet.getCellMeta(addr, 'note')).toBe('hello')
  })

  it('setCellMeta 相同 payload 无操作、不入历史', () => {
    const sheet = new Sheet()
    const addr = { row: 0, col: 0 }
    const payload = { x: 1 }

    sheet.setCellMeta(addr, 'report', payload)
    expect(sheet.canUndo).toBe(true)

    sheet.setCellMeta(addr, 'report', { x: 1 })
    expect(sheet.canUndo).toBe(true)
    expect(sheet.undo()).toBe(true)
    expect(sheet.getCellMeta(addr, 'report')).toBeUndefined()
  })

  it('clearCellMeta 对不存在 meta 无操作、不入历史', () => {
    const sheet = new Sheet()
    sheet.clearCellMeta({ row: 0, col: 0 }, 'report')
    expect(sheet.canUndo).toBe(false)
  })

  it('getCellMeta 返回副本，外部修改不影响模型', () => {
    const sheet = new Sheet()
    const addr = { row: 0, col: 0 }
    sheet.setCellMeta(addr, 'report', { items: [1] })

    const read = sheet.getCellMeta<{ items: number[] }>(addr, 'report')!
    read.items.push(2)

    expect(sheet.getCellMeta(addr, 'report')).toEqual({ items: [1] })
  })
})

describe('Sheet Cell Meta：undo / redo', () => {
  it('setCellMeta 后 undo 清除、redo 恢复', () => {
    const sheet = new Sheet()
    const addr = { row: 2, col: 3 }
    const payload = { field: 'name' }

    sheet.setCellMeta(addr, 'report', payload)
    expect(sheet.getCellMeta(addr, 'report')).toEqual(payload)

    expect(sheet.undo()).toBe(true)
    expect(sheet.getCellMeta(addr, 'report')).toBeUndefined()

    expect(sheet.redo()).toBe(true)
    expect(sheet.getCellMeta(addr, 'report')).toEqual(payload)
  })

  it('覆盖已有 meta 后 undo 还原旧值', () => {
    const sheet = new Sheet()
    const addr = { row: 0, col: 0 }

    sheet.setCellMeta(addr, 'report', { v: 1 })
    sheet.setCellMeta(addr, 'report', { v: 2 })

    expect(sheet.undo()).toBe(true)
    expect(sheet.getCellMeta(addr, 'report')).toEqual({ v: 1 })

    expect(sheet.undo()).toBe(true)
    expect(sheet.getCellMeta(addr, 'report')).toBeUndefined()
  })

  it('clearCellMeta 后 undo 恢复', () => {
    const sheet = new Sheet()
    const addr = { row: 1, col: 1 }
    sheet.setCellMeta(addr, 'report', { kept: true })
    sheet.clearCellMeta(addr, 'report')

    expect(sheet.getCellMeta(addr, 'report')).toBeUndefined()

    expect(sheet.undo()).toBe(true)
    expect(sheet.getCellMeta(addr, 'report')).toEqual({ kept: true })

    expect(sheet.redo()).toBe(true)
    expect(sheet.getCellMeta(addr, 'report')).toBeUndefined()
  })
})

describe('Sheet Cell Meta：快照 roundtrip', () => {
  it('snapshot / restore 保留 meta 字段', () => {
    const sheet = new Sheet()
    sheet.setCellMeta({ row: 0, col: 0 }, 'report', { binding: 'a' })
    sheet.setCellMeta({ row: 1, col: 2 }, 'report', { binding: 'b' })
    sheet.setCellMeta({ row: 0, col: 0 }, 'note', 'x')

    const snap = sheet.snapshot()
    expect(snap.meta).toHaveLength(3)

    const restored = new Sheet('R')
    restored.restore(snap)
    expect(restored.getCellMeta({ row: 0, col: 0 }, 'report')).toEqual({ binding: 'a' })
    expect(restored.getCellMeta({ row: 1, col: 2 }, 'report')).toEqual({ binding: 'b' })
    expect(restored.getCellMeta({ row: 0, col: 0 }, 'note')).toBe('x')
  })

  it('空 sheet 序列化兼容：无 meta 字段', () => {
    const sheet = new Sheet()
    const snap = sheet.snapshot()
    expect(snap.meta).toBeUndefined()
    expect('meta' in snap).toBe(false)

    const restored = new Sheet('R')
    restored.restore(snap)
    expect(restored.getCellMeta({ row: 0, col: 0 }, 'report')).toBeUndefined()
  })

  it('旧快照缺省 meta → restore 清空为无 meta', () => {
    const sheet = new Sheet()
    sheet.setCellMeta({ row: 0, col: 0 }, 'report', { x: 1 })
    const snap: SheetSnapshot = {
      cells: [],
      styles: [],
      merges: [],
      frozen: { rows: 0, cols: 0 },
      rows: 0,
      cols: 0
    }
    const restored = new Sheet('R')
    restored.restore(snap)
    expect(restored.getCellMeta({ row: 0, col: 0 }, 'report')).toBeUndefined()
  })

  it('经 JSON 序列化 roundtrip 保留 meta', () => {
    const sheet = new Sheet()
    sheet.setCellMeta({ row: 0, col: 0 }, 'report', { nested: { n: 42 } })

    const snap = JSON.parse(JSON.stringify(sheet.snapshot())) as SheetSnapshot
    const restored = new Sheet('R')
    restored.restore(snap)
    expect(restored.getCellMeta({ row: 0, col: 0 }, 'report')).toEqual({ nested: { n: 42 } })
  })
})
