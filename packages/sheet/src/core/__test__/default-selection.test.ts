import { describe, expect, it, vi } from 'vitest'

import { parseRange } from '../address'
import { Sheet, type SheetSnapshot } from '../sheet'
import { Workbook } from '../workbook'

const A1 = { row: 0, col: 0 }
const B2 = { row: 1, col: 1 }
const C3 = { row: 2, col: 2 }

describe('默认选区 A1', () => {
  it('新建 Sheet 默认选中 A1', () => {
    const sheet = new Sheet()
    expect(sheet.getSelection()).toEqual({ activeCell: A1, ranges: [{ start: A1, end: A1 }] })
  })

  it('Workbook 默认表与 addSheet 新表均默认 A1', () => {
    const wb = new Workbook()
    expect(wb.activeSheet.getSelection().activeCell).toEqual(A1)

    const s2 = wb.addSheet()
    expect(s2.getSelection().activeCell).toEqual(A1)
    expect(s2.getSelection().ranges).toEqual([{ start: A1, end: A1 }])
  })

  it('snapshot 写入当前选区；restore 往返保留', () => {
    const sheet = new Sheet()
    sheet.selectRange({ start: B2, end: C3 }, C3)
    const snap = sheet.snapshot()
    expect(snap.selection).toEqual({ activeCell: C3, ranges: [{ start: B2, end: C3 }] })

    const restored = new Sheet()
    // 构造期已是 A1；restore 应覆盖为快照选区
    expect(restored.getSelection().activeCell).toEqual(A1)
    restored.restore(snap)
    expect(restored.getSelection()).toEqual({ activeCell: C3, ranges: [{ start: B2, end: C3 }] })
  })

  it('旧快照无 selection 字段 → restore 回落 A1', () => {
    const sheet = new Sheet()
    sheet.setCellValue(B2, 'x')
    sheet.selectCell(C3)
    const legacy = sheet.snapshot() as SheetSnapshot
    delete legacy.selection
    expect(legacy.selection).toBeUndefined()

    const restored = new Sheet()
    restored.selectCell(B2) // 先偏离 A1，确认 restore 会回落
    restored.restore(legacy)
    expect(restored.getSelection()).toEqual({ activeCell: A1, ranges: [{ start: A1, end: A1 }] })
    expect(restored.getCellData(B2)).toMatchObject({ v: 'x' })
  })

  it('restore 选区经合并锚点解析，结果合法', () => {
    const sheet = new Sheet()
    sheet.mergeCells(parseRange('B2:C3')!)
    // 活动格落在被覆盖格 → 快照写入前已解析；此处故意构造覆盖格坐标模拟畸形/旧数据
    const snap = sheet.snapshot()
    snap.selection = { activeCell: C3, ranges: [{ start: B2, end: C3 }] }

    const restored = new Sheet()
    restored.restore(snap)
    expect(restored.getSelection().activeCell).toEqual(B2)
    expect(restored.getSelection().ranges).toEqual([{ start: B2, end: C3 }])
  })

  it('restore 畸形 selection（缺 ranges）→ 单格活动区，不抛错', () => {
    const sheet = new Sheet()
    const snap = sheet.snapshot()
    snap.selection = { activeCell: B2, ranges: undefined as unknown as [] }

    const restored = new Sheet()
    restored.restore(snap)
    expect(restored.getSelection()).toEqual({ activeCell: B2, ranges: [{ start: B2, end: B2 }] })
  })

  it('restore 不发 selection-change', () => {
    const sheet = new Sheet()
    sheet.selectCell(B2)
    const snap = sheet.snapshot()

    const restored = new Sheet()
    const handler = vi.fn()
    restored.on('selection-change', handler)
    restored.restore(snap)
    expect(handler).not.toHaveBeenCalled()
    expect(restored.getSelection().activeCell).toEqual(B2)
  })

  it('快照 JSON 往返保留选区', () => {
    const sheet = new Sheet()
    sheet.selectRange({ start: A1, end: B2 })
    const serialized = JSON.stringify(sheet.snapshot())
    const restored = new Sheet()
    restored.restore(JSON.parse(serialized) as SheetSnapshot)
    expect(restored.getSelection()).toEqual({ activeCell: A1, ranges: [{ start: A1, end: B2 }] })
  })

  it('选区不进 undo 历史（语义保持）', () => {
    const sheet = new Sheet()
    sheet.setCellValue(A1, 1)
    sheet.selectCell(B2)
    sheet.undo()
    expect(sheet.getSelection().activeCell).toEqual(B2)
    expect(sheet.getCellData(A1)).toBeUndefined()
  })
})
