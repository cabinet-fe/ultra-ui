import { describe, expect, it } from 'vitest'

import { parseRange } from '../address'
import { RestoreSheetCommand } from '../command/restore-sheet'
import type { SheetSnapshot } from '../sheet'
import { Sheet } from '../sheet'
import { Workbook } from '../workbook'

/**
 * RestoreSheetCommand（整表快照替换）语义测试：
 * - 一次替换 = 单 undo 单元；undo/redo 双向快照回放
 * - 只替换 cells/styles/merges：选区 / 冻结 / 行高 / 尺寸不进 undo
 *   （对齐「选区不进 undo」「冻结与行高不进 undo」「渲染尺寸不进 undo」约定）
 * - 公式依赖图整体重建 + 跨表引用方重算（快照全部格视为变更格）
 * - content-reset 事件（执行 / undo / redo 各一次，视图层全量刷新信号）
 */
describe('RestoreSheetCommand（整表快照替换）', () => {
  it('替换内容 / 样式 / 合并；undo 恢复 before；redo 再应用；单 undo 单元', () => {
    const sheet = new Sheet('S')
    sheet.setCellValue({ row: 0, col: 0 }, 'old')
    sheet.setCellStyle(parseRange('A1')!, { fill: { color: '#FF0000' } })
    sheet.mergeCells(parseRange('B2:C3')!)
    sheet.setFrozen(1, 0)
    sheet.setRowHeight(2, 40)

    const after = new Sheet('S')
    after.setCellValue({ row: 0, col: 0 }, 'new')
    after.setCellStyle(parseRange('A1')!, { fill: { color: '#00FF00' } })

    sheet.executeCommand(RestoreSheetCommand.id, { snapshot: after.snapshot() })

    expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'new' })
    expect(sheet.getCellStyle({ row: 0, col: 0 })).toEqual({ fill: { color: '#00FF00' } })
    expect(sheet.merges.size).toBe(0)
    // setCellValue + setCellStyle + mergeCells 3 条前置历史 + 1 条替换命令
    expect(sheet.history.undoSize).toBe(4)

    sheet.undo()
    expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'old' })
    expect(sheet.getCellStyle({ row: 0, col: 0 })).toEqual({ fill: { color: '#FF0000' } })
    expect(sheet.merges.size).toBe(1)

    sheet.redo()
    expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'new' })
    expect(sheet.merges.size).toBe(0)
  })

  it('选区 / 冻结 / 行高 / 尺寸不进 undo（undo/redo 后保持替换后状态）', () => {
    const sheet = new Sheet('S')
    sheet.setCellValue({ row: 0, col: 0 }, 'old')
    sheet.setFrozen(1, 2)
    sheet.setRowHeight(3, 55)
    const C3 = { row: 2, col: 2 }
    sheet.selectCell(C3)

    const after = new Sheet('S')
    after.setCellValue({ row: 5, col: 5 }, 'deep')
    const snapshot = after.snapshot()
    snapshot.frozen = { rows: 0, cols: 0 }
    snapshot.rows = 20
    snapshot.cols = 10

    sheet.executeCommand(RestoreSheetCommand.id, { snapshot })

    // redo 侧：尺寸按快照扩张（max 合并）；冻结应用快照值（模型状态，随替换写入）
    expect(sheet.rows).toBeGreaterThanOrEqual(20)
    expect(sheet.cols).toBeGreaterThanOrEqual(10)
    expect(sheet.frozen).toEqual({ rows: 0, cols: 0 })
    expect(sheet.getCellData({ row: 5, col: 5 })).toMatchObject({ v: 'deep' })

    sheet.undo()
    // undo 只还原内容；选区/冻结/行高/尺寸保持替换后状态（同现状逐格回放行为）
    expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'old' })
    expect(sheet.getCellData({ row: 5, col: 5 })).toBeUndefined()
    expect(sheet.getSelection().activeCell).toEqual(C3)
    expect(sheet.frozen).toEqual({ rows: 0, cols: 0 })
    expect(sheet.getRowHeight(3)).toBe(55)
    expect(sheet.rows).toBeGreaterThanOrEqual(20)

    sheet.redo()
    expect(sheet.getCellData({ row: 5, col: 5 })).toMatchObject({ v: 'deep' })
    expect(sheet.getSelection().activeCell).toEqual(C3)
    expect(sheet.frozen).toEqual({ rows: 0, cols: 0 })
  })

  it('content-reset 事件：执行 / undo / redo 各发一次；不发 cell-change', () => {
    const sheet = new Sheet('S')
    sheet.setCellValue({ row: 0, col: 0 }, 'old')
    let resets = 0
    let cellChanges = 0
    sheet.on('content-reset', () => resets++)
    sheet.on('cell-change', () => cellChanges++)

    const after = new Sheet('S')
    after.setCellValue({ row: 0, col: 0 }, 'new')
    after.setCellValue({ row: 1, col: 1 }, 'x')

    sheet.executeCommand(RestoreSheetCommand.id, { snapshot: after.snapshot() })
    sheet.undo()
    sheet.redo()

    expect(resets).toBe(3)
    // 整表替换不发逐格 cell-change（视图风暴根源；视图层按 content-reset 全量刷新）
    expect(cellChanges).toBe(0)
  })

  it('公式依赖图整体重建：替换后新公式可被引用重算，旧公式节点不残留', () => {
    const wb = new Workbook()
    const s1 = wb.activeSheet
    wb.renameSheet('Sheet1', 'S1')
    s1.setCellValue({ row: 0, col: 0 }, 10) // A1=10
    const s2 = wb.addSheet('S2')
    s2.setCellFormula({ row: 0, col: 0 }, '=S1!A1*2') // 缓存 20

    expect(s2.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 20, t: 'n' })

    // 替换 S1 内容：A1 改为 7，且 B1 写公式 '=A1+1'（新节点注册）
    const snapshot: SheetSnapshot = {
      cells: [
        { row: 0, col: 0, v: 7, t: 'n' },
        { row: 0, col: 1, f: 'A1+1', v: 8, t: 'n' }
      ],
      styles: [],
      merges: [],
      frozen: { rows: 0, cols: 0 },
      rows: 2,
      cols: 2
    }

    s1.executeCommand(RestoreSheetCommand.id, { snapshot })

    // 快照全部格视为变更格：S2 引用 S1!A1 的公式联动重算（7×2=14）
    expect(s1.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 7, t: 'n' })
    expect(s1.getCellData({ row: 0, col: 1 })).toMatchObject({ v: 8, t: 'n' })
    expect(s2.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 14, t: 'n' })

    // 依赖图节点已重建：编辑 S1!A1 后 S2 公式继续联动（旧节点残留会失效）
    s1.setCellValue({ row: 0, col: 0 }, 100)
    expect(s2.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 200, t: 'n' })

    // undo 编辑：A1 回 7、S2 回 14（派生补丁精确回放）
    s1.undo()
    expect(s1.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 7, t: 'n' })
    expect(s2.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 14, t: 'n' })

    // undo 整表替换：A1 回 10、S2 缓存回旧值 20
    s1.undo()
    expect(s1.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 10, t: 'n' })
    expect(s2.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 20, t: 'n' })
    // redo 整表替换：再变 14
    s1.redo()
    expect(s2.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 14, t: 'n' })
  })

  it('被清空的旧格纳入重算标脏：跨表引用方缓存联动（旧实现 clear 全量标脏语义）', () => {
    const wb = new Workbook()
    const s1 = wb.activeSheet
    wb.renameSheet('Sheet1', 'S1')
    s1.setCellValue({ row: 0, col: 0 }, 5) // A1=5
    const s2 = wb.addSheet('S2')
    s2.setCellFormula({ row: 0, col: 0 }, '=S1!A1') // 缓存 5

    expect(s2.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 5, t: 'n' })

    // 替换 S1：新快照不含 A1（被清空）
    const snapshot: SheetSnapshot = {
      cells: [{ row: 2, col: 2, v: 'deep', t: 's' }],
      styles: [],
      merges: [],
      frozen: { rows: 0, cols: 0 },
      rows: 3,
      cols: 3
    }
    s1.executeCommand(RestoreSheetCommand.id, { snapshot })

    expect(s1.getCellData({ row: 0, col: 0 })).toBeUndefined()
    // 被清空的旧格标脏：S2 引用 S1!A1 重算 → 空 → 0
    expect(s2.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 0, t: 'n' })

    // undo：A1 回 5，S2 缓存回 5
    s1.undo()
    expect(s1.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 5, t: 'n' })
    expect(s2.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 5, t: 'n' })
  })
})
