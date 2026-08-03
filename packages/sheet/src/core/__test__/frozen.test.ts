import { describe, expect, it, vi } from 'vitest'

import { Sheet } from '../sheet'
import { Workbook } from '../workbook'

describe('Sheet 冻结状态', () => {
  it('默认 0/0；getter 返回副本（外部修改不影响模型）', () => {
    const sheet = new Sheet()
    expect(sheet.frozen).toEqual({ rows: 0, cols: 0 })

    const frozen = sheet.frozen
    frozen.rows = 5
    expect(sheet.frozen).toEqual({ rows: 0, cols: 0 })
  })

  it('setFrozen 生效 + frozen-change 事件；相同值不重复触发', () => {
    const sheet = new Sheet()
    const handler = vi.fn()
    sheet.on('frozen-change', handler)

    sheet.setFrozen(1, 2)
    expect(sheet.frozen).toEqual({ rows: 1, cols: 2 })
    expect(handler).toHaveBeenCalledWith({ rows: 1, cols: 2 })

    sheet.setFrozen(1, 2)
    expect(handler).toHaveBeenCalledTimes(1)

    sheet.setFrozen(0, 0)
    expect(handler).toHaveBeenCalledTimes(2)
  })

  it('非法值规范化：负数 / NaN / 小数 → 0 或向下取整', () => {
    const sheet = new Sheet()
    sheet.setFrozen(-1, 3.9)
    expect(sheet.frozen).toEqual({ rows: 0, cols: 3 })

    sheet.setFrozen(Number.NaN, Number.POSITIVE_INFINITY)
    expect(sheet.frozen).toEqual({ rows: 0, cols: 0 })
  })

  it('不进 undo：setFrozen 不产生历史条目，undo/redo 不影响冻结', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 0 }, 'x')

    sheet.setFrozen(2, 1)
    expect(sheet.history.undoSize).toBe(1) // 只有 setCellValue 一条

    sheet.undo()
    expect(sheet.frozen).toEqual({ rows: 2, cols: 1 })
    sheet.redo()
    expect(sheet.frozen).toEqual({ rows: 2, cols: 1 })
  })
})

describe('Sheet 快照（含冻结）', () => {
  it('snapshot 包含 frozen；restore 还原单元格 / 样式 / 合并 / 冻结', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 0 }, 42)
    sheet.setCellStyle(
      { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
      { fill: { color: '#FF0000' } }
    )
    sheet.mergeCells({ start: { row: 1, col: 1 }, end: { row: 2, col: 2 } })
    sheet.setFrozen(3, 4)

    const snapshot = sheet.snapshot()
    expect(snapshot.frozen).toEqual({ rows: 3, cols: 4 })

    const restored = new Sheet()
    restored.restore(snapshot)

    expect(restored.frozen).toEqual({ rows: 3, cols: 4 })
    expect(restored.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 42, t: 'n' })
    // 样式池随快照恢复：s 引用有效（id 重新分配为 1）
    expect(restored.getCellData({ row: 0, col: 0 })!.s).toBe(1)
    expect(restored.getCellStyle({ row: 0, col: 0 })?.fill?.color).toBe('#FF0000')
    expect(restored.merges.getMergeAt({ row: 2, col: 2 })).toEqual({
      start: { row: 1, col: 1 },
      end: { row: 2, col: 2 }
    })
  })

  it('restore 冻结变化时发 frozen-change；相同冻结不发', () => {
    const sheet = new Sheet()
    sheet.setFrozen(1, 1)
    const snapshot = sheet.snapshot()

    const restored = new Sheet()
    const handler = vi.fn()
    restored.on('frozen-change', handler)
    restored.restore(snapshot)
    expect(handler).toHaveBeenCalledWith({ rows: 1, cols: 1 })

    restored.restore(snapshot) // 冻结未变 → 不再触发
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('快照 JSON 往返一致（宿主序列化持久化场景）', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 1 }, 'hello')
    sheet.setFrozen(2, 3)

    const serialized = JSON.stringify(sheet.snapshot())
    const restored = new Sheet()
    restored.restore(JSON.parse(serialized) as ReturnType<Sheet['snapshot']>)

    expect(restored.getCellData({ row: 0, col: 1 })).toEqual({ v: 'hello', t: 's' })
    expect(restored.frozen).toEqual({ rows: 2, cols: 3 })
  })

  it('Workbook 各 sheet 冻结独立', () => {
    const wb = new Workbook()
    const s1 = wb.activeSheet
    const s2 = wb.addSheet()

    s1.setFrozen(1, 0)
    expect(s1.frozen).toEqual({ rows: 1, cols: 0 })
    expect(s2.frozen).toEqual({ rows: 0, cols: 0 })
  })
})
