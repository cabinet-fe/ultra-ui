import { ListTable } from '@visactor/vtable'
import { describe, expect, it } from 'vitest'

import { parseRange } from '../../core/address'
import { Sheet } from '../../core/sheet'
import { SheetGrid } from '../sheet-grid'

function createContainer(): HTMLElement {
  const el = document.createElement('div')
  el.style.width = '800px'
  el.style.height = '600px'
  document.body.appendChild(el)
  return el
}

function createGrid() {
  const sheet = new Sheet()
  const grid = new SheetGrid({ container: createContainer(), sheet, rows: 20, cols: 6 })
  return { sheet, grid, table: grid.getTable() }
}

/** 直接驱动 VTable stateManager 模拟一次完整拖选（表格坐标） */
function dragSelect(
  table: ListTable,
  start: { col: number; row: number },
  end: { col: number; row: number }
) {
  const sm = (table as unknown as { stateManager: any }).stateManager
  // pointerdown（interactionState 为 default）
  sm.updateSelectPos(start.col, start.row, false, false, false, true)
  // 拖拽中
  sm.updateInteractionState('grabing')
  sm.updateSelectPos(end.col, end.row, false, false, false, true)
  // pointerup → endSelectCells 派发 SELECTED_CELL → 我们的 handler 回驱
  sm.endSelectCells()
  table.fireListeners(ListTable.EVENT_TYPE.DRAG_SELECT_END, {})
}

describe('VTable 状态机 + 桥接层（模拟真实拖选序列）', () => {
  it('两次普通拖选 → VTable 与模型始终单区域', () => {
    const { sheet, grid, table } = createGrid()
    try {
      // 第一次拖选：B2:D4
      dragSelect(table, { col: 1, row: 1 }, { col: 3, row: 3 })
      let ranges = table.getSelectedCellRanges()
      console.log(
        '第一次拖选后 VTable:',
        JSON.stringify(ranges),
        '模型:',
        JSON.stringify(sheet.getSelection().ranges)
      )
      expect(ranges.length).toBe(1)
      expect(sheet.getSelection().ranges).toEqual([parseRange('A1:C3')])

      // 第二次拖选：E5:F8 —— pointerdown 时必须清空旧区域
      dragSelect(table, { col: 5, row: 5 }, { col: 6, row: 8 })
      ranges = table.getSelectedCellRanges()
      console.log(
        '第二次拖选后 VTable:',
        JSON.stringify(ranges),
        '模型:',
        JSON.stringify(sheet.getSelection().ranges)
      )
      expect(ranges.length).toBe(1)
      expect(sheet.getSelection().ranges).toEqual([parseRange('E5:F8')])

      // 第三次：单击 D9 —— 也必须是单区域
      const sm = (table as unknown as { stateManager: any }).stateManager
      sm.updateSelectPos(4, 9, false, false, false, true)
      sm.endSelectCells()
      table.fireListeners(ListTable.EVENT_TYPE.DRAG_SELECT_END, {})
      ranges = table.getSelectedCellRanges()
      console.log(
        '单击后 VTable:',
        JSON.stringify(ranges),
        '模型:',
        JSON.stringify(sheet.getSelection().ranges)
      )
      expect(ranges.length).toBe(1)
    } finally {
      grid.release()
    }
  })
})
