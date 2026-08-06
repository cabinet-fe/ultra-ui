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

describe('选区交互时序', () => {
  it('拖选结束（SELECTED_CELL → DRAG_SELECT_END）模型保留完整区域，不收缩为单格', () => {
    const { sheet, grid, table } = createGrid()
    try {
      // 模拟 VTable 内部拖选完成后的选区（表格坐标，含行号列/列头偏移）
      table.selectCells([{ start: { col: 1, row: 1 }, end: { col: 3, row: 4 } }])
      // VTable endSelectCells 派发 SELECTED_CELL（携带区域末尾格）
      table.fireListeners(ListTable.EVENT_TYPE.SELECTED_CELL, { col: 3, row: 4 })
      // VTable 随后派发 DRAG_SELECT_END
      table.fireListeners(ListTable.EVENT_TYPE.DRAG_SELECT_END, {})

      const { activeCell, ranges } = sheet.getSelection()
      // 表格坐标 {col1,row1}-{col3,row4} 含行号列/列头偏移 → 模型 A1:C4
      expect(ranges).toEqual([parseRange('A1:C4')])
      expect(activeCell).toEqual({ row: 0, col: 0 })
    } finally {
      grid.release()
    }
  })

  it('单击单元格（SELECTED_CELL 单格选区）模型同步为单格', () => {
    const { sheet, grid, table } = createGrid()
    try {
      table.selectCells([{ start: { col: 2, row: 3 }, end: { col: 2, row: 3 } }])
      table.fireListeners(ListTable.EVENT_TYPE.SELECTED_CELL, { col: 2, row: 3 })

      const { activeCell, ranges } = sheet.getSelection()
      // 表格坐标 {col2,row3} 含偏移 → 模型 B3
      expect(ranges).toEqual([parseRange('B3')])
      expect(activeCell).toEqual({ row: 2, col: 1 })
    } finally {
      grid.release()
    }
  })

  it('多选区残留（异常路径）→ SELECTED_CELL 同步最新区域并回驱收敛为单选', () => {
    const { sheet, grid, table } = createGrid()
    try {
      // 模拟 VTable 内部存在两个选区（如旧版本 Ctrl 多选残留）：A1:C3 + E2:F5
      table.selectCells([
        { start: { col: 1, row: 1 }, end: { col: 3, row: 3 } },
        { start: { col: 5, row: 2 }, end: { col: 6, row: 5 } }
      ])
      expect(table.getSelectedCellRanges().length).toBe(2)

      table.fireListeners(ListTable.EVENT_TYPE.SELECTED_CELL, { col: 6, row: 5 })

      // 模型同步最新（最后一个）区域 → 回驱 selectCells 收敛 VTable 为单选
      const { ranges } = sheet.getSelection()
      expect(ranges).toEqual([parseRange('E2:F5')])
      expect(table.getSelectedCellRanges().length).toBe(1)
    } finally {
      grid.release()
    }
  })

  it('禁用 Ctrl 追加选区：keyboardOptions.ctrlMultiSelect 为 false', () => {
    const { grid, table } = createGrid()
    try {
      expect(table.options.keyboardOptions?.ctrlMultiSelect).toBe(false)
    } finally {
      grid.release()
    }
  })

  it('interceptSelection：SELECTED_CELL 不写模型；粘性标志阻止 DRAG_SELECT_END 误写', () => {
    const sheet = new Sheet()
    sheet.selectCell({ row: 5, col: 5 })
    const intercepted: string[] = []
    let refMode = true
    const container = createContainer()
    const grid = new SheetGrid({
      container,
      sheet,
      rows: 20,
      cols: 6,
      interceptSelection: () => refMode,
      onSelectionIntercept: (range) => {
        intercepted.push(`${range.start.row},${range.start.col}:${range.end.row},${range.end.col}`)
        // 模拟公式栏插入后 isRefSelecting 变 false
        refMode = false
      }
    })
    const table = grid.getTable()
    try {
      table.selectCells([{ start: { col: 1, row: 1 }, end: { col: 2, row: 2 } }])
      table.fireListeners(ListTable.EVENT_TYPE.SELECTED_CELL, { col: 2, row: 2 })
      table.fireListeners(ListTable.EVENT_TYPE.DRAG_SELECT_END, {})

      expect(intercepted).toEqual(['0,0:1,1'])
      // 模型选区保持编辑格，未被拖选覆盖
      expect(sheet.getSelection().activeCell).toEqual({ row: 5, col: 5 })
      expect(sheet.getSelection().ranges[0]).toEqual({
        start: { row: 5, col: 5 },
        end: { row: 5, col: 5 }
      })
    } finally {
      grid.release()
    }
  })

  it('interceptSelection：仅 DRAG_SELECT_END 时仍插入且不写模型', () => {
    const sheet = new Sheet()
    sheet.selectCell({ row: 3, col: 3 })
    const intercepted: string[] = []
    const container = createContainer()
    const grid = new SheetGrid({
      container,
      sheet,
      rows: 20,
      cols: 6,
      interceptSelection: () => true,
      onSelectionIntercept: (range) => {
        intercepted.push(`${range.start.col}-${range.end.col}`)
      }
    })
    const table = grid.getTable()
    try {
      table.selectCells([{ start: { col: 1, row: 1 }, end: { col: 3, row: 1 } }])
      // 模拟 SELECTED_CELL 未走到拦截、仅 DRAG_SELECT_END 的兜底路径
      table.fireListeners(ListTable.EVENT_TYPE.DRAG_SELECT_END, {})

      expect(intercepted).toEqual(['0-2'])
      expect(sheet.getSelection().activeCell).toEqual({ row: 3, col: 3 })
    } finally {
      grid.release()
    }
  })
})
