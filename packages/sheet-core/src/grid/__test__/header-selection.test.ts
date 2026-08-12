import { ListTable } from '@visactor/vtable'
import { describe, expect, it, vi } from 'vitest'

import { parseRange } from '../../core/address'
import { Sheet } from '../../core/sheet'
import { SheetGrid } from '../sheet-grid'

function createContainer(): HTMLElement {
  const el = document.createElement('div')
  el.style.width = '400px'
  el.style.height = '300px'
  document.body.appendChild(el)
  return el
}

function createGrid(rows = 50, cols = 20) {
  const sheet = new Sheet()
  const grid = new SheetGrid({ container: createContainer(), sheet, rows, cols })
  return { sheet, grid, table: grid.getTable() }
}

/** 模拟视口可见 body 范围（表格坐标，含行号列/列头偏移） */
function mockVisibleRange(
  table: ListTable,
  range: { colStart: number; rowStart: number; colEnd: number; rowEnd: number }
): void {
  vi.spyOn(table, 'getBodyVisibleCellRange').mockReturnValue(range)
}

describe('行号/列头选区锚点（Excel 语义）', () => {
  it('点击行号：整行选区，active 落在当前视口最左可见列（含部分可见）', () => {
    const { sheet, grid, table } = createGrid()
    try {
      // 视口已滚到表格列 6..12（模型 E..K）
      mockVisibleRange(table, { colStart: 6, rowStart: 1, colEnd: 12, rowEnd: 15 })
      const scrollSpy = vi.spyOn(table, 'scrollToCell')

      // VTable 默认行号选区：start 含行号列 0，end 为末列；SELECTED_CELL 带 end
      table.selectCells([{ start: { col: 0, row: 5 }, end: { col: 20, row: 5 } }])
      table.fireListeners(ListTable.EVENT_TYPE.SELECTED_CELL, {
        col: 20,
        row: 5,
        ranges: table.getSelectedCellRanges()
      })

      const { activeCell, ranges } = sheet.getSelection()
      expect(ranges).toEqual([parseRange('A5:T5')])
      // 模型行 4（表格 row 5），视口最左模型列 5（表格 col 6）
      expect(activeCell).toEqual({ row: 4, col: 5 })
      // 活动格已在视口内：回驱不得滚到行末 / 行首
      expect(scrollSpy).not.toHaveBeenCalledWith({ col: 20, row: 5 })
      expect(scrollSpy).not.toHaveBeenCalledWith({ col: 1, row: 5 })
    } finally {
      grid.release()
    }
  })

  it('点击列头：整列选区，active 落在当前视口最上可见行（含部分可见）', () => {
    const { sheet, grid, table } = createGrid()
    try {
      mockVisibleRange(table, { colStart: 1, rowStart: 10, colEnd: 8, rowEnd: 20 })
      const scrollSpy = vi.spyOn(table, 'scrollToCell')

      // VTable 列头选区：start.row 为列头 0，end 为末行
      table.selectCells([{ start: { col: 5, row: 0 }, end: { col: 5, row: 50 } }])
      table.fireListeners(ListTable.EVENT_TYPE.SELECTED_CELL, {
        col: 5,
        row: 50,
        ranges: table.getSelectedCellRanges()
      })

      const { activeCell, ranges } = sheet.getSelection()
      expect(ranges).toEqual([parseRange('E1:E50')])
      // 模型列 4（表格 col 5），视口最上模型行 9（表格 row 10）
      expect(activeCell).toEqual({ row: 9, col: 4 })
      expect(scrollSpy).not.toHaveBeenCalledWith({ col: 5, row: 50 })
      expect(scrollSpy).not.toHaveBeenCalledWith({ col: 5, row: 1 })
    } finally {
      grid.release()
    }
  })

  it('body 模式整行选区（start 已在首个 body 列）同样锚到视口左缘', () => {
    const { sheet, grid, table } = createGrid()
    try {
      mockVisibleRange(table, { colStart: 4, rowStart: 2, colEnd: 10, rowEnd: 12 })

      table.selectCells([{ start: { col: 1, row: 8 }, end: { col: 20, row: 8 } }])
      table.fireListeners(ListTable.EVENT_TYPE.SELECTED_CELL, {
        col: 20,
        row: 8,
        ranges: table.getSelectedCellRanges()
      })

      const { activeCell, ranges } = sheet.getSelection()
      expect(ranges).toEqual([parseRange('A8:T8')])
      expect(activeCell).toEqual({ row: 7, col: 3 })
    } finally {
      grid.release()
    }
  })

  it('非整行/整列的普通拖选：active 仍为区域起点', () => {
    const { sheet, grid, table } = createGrid()
    try {
      mockVisibleRange(table, { colStart: 6, rowStart: 10, colEnd: 12, rowEnd: 20 })

      table.selectCells([{ start: { col: 2, row: 3 }, end: { col: 4, row: 5 } }])
      table.fireListeners(ListTable.EVENT_TYPE.SELECTED_CELL, {
        col: 4,
        row: 5,
        ranges: table.getSelectedCellRanges()
      })

      const { activeCell, ranges } = sheet.getSelection()
      expect(ranges).toEqual([parseRange('B3:D5')])
      expect(activeCell).toEqual({ row: 2, col: 1 })
    } finally {
      grid.release()
    }
  })

  it('整行选区回驱：VTable 选区含行号列（col 0），行头可高亮', () => {
    const { sheet, grid, table } = createGrid(20, 6)
    try {
      sheet.selectRange(parseRange('A3:F5'))
      const ranges = table.getSelectedCellRanges()
      expect(ranges).toHaveLength(1)
      expect(ranges[0]!.start.col).toBe(0)
      expect(ranges[0]!.start.row).toBe(3)
      expect(ranges[0]!.end.col).toBe(6)
      expect(ranges[0]!.end.row).toBe(5)
    } finally {
      grid.release()
    }
  })

  it('整列选区回驱：VTable 选区含列头行（row 0），列头可高亮', () => {
    const { sheet, grid, table } = createGrid(20, 6)
    try {
      sheet.selectRange(parseRange('C1:C20'))
      const ranges = table.getSelectedCellRanges()
      expect(ranges).toHaveLength(1)
      expect(ranges[0]!.start.col).toBe(3)
      expect(ranges[0]!.start.row).toBe(0)
      expect(ranges[0]!.end.col).toBe(3)
      expect(ranges[0]!.end.row).toBe(20)
    } finally {
      grid.release()
    }
  })

  it('列头拖选仅覆盖列头行时：扩展为整列选区', () => {
    const { sheet, grid, table } = createGrid(20, 10)
    try {
      // VTable 列头多选常见形态：只覆盖 header 行，未扩到 body
      table.selectCells([{ start: { col: 3, row: 0 }, end: { col: 5, row: 0 } }])
      table.fireListeners(ListTable.EVENT_TYPE.SELECTED_CELL, {
        col: 5,
        row: 0,
        ranges: table.getSelectedCellRanges()
      })

      const { ranges } = sheet.getSelection()
      expect(ranges).toEqual([parseRange('C1:E20')])
      const synced = table.getSelectedCellRanges()
      expect(synced[0]!.start.row).toBe(0)
      expect(synced[0]!.end.row).toBe(20)
    } finally {
      grid.release()
    }
  })

  it('行号拖选仅覆盖行号列时：扩展为整行选区', () => {
    const { sheet, grid, table } = createGrid(20, 6)
    try {
      table.selectCells([{ start: { col: 0, row: 4 }, end: { col: 0, row: 7 } }])
      table.fireListeners(ListTable.EVENT_TYPE.SELECTED_CELL, {
        col: 0,
        row: 7,
        ranges: table.getSelectedCellRanges()
      })

      const { ranges } = sheet.getSelection()
      expect(ranges).toEqual([parseRange('A4:F7')])
      const synced = table.getSelectedCellRanges()
      expect(synced[0]!.start.col).toBe(0)
      expect(synced[0]!.end.col).toBe(6)
    } finally {
      grid.release()
    }
  })

  it('列头拖选过程中实时扩整列（对齐行号拖选，不等松手）', () => {
    const { sheet, grid, table } = createGrid(20, 10)
    try {
      const sm = (table as unknown as { stateManager: any }).stateManager
      // pointerdown 列头 C → VTable 初始已是整列
      sm.updateSelectPos(3, 0, false, false, false, true)
      let ranges = table.getSelectedCellRanges()
      expect(ranges[0]!.start.row).toBe(0)
      expect(ranges[0]!.end.row).toBe(20)

      // 拖到列头 E：补丁在入口把 row 改成末行，VTable 一次画整列（不事后清边框）
      sm.updateInteractionState('grabing')
      sm.updateSelectPos(5, 0, false, false, false, true)
      ranges = table.getSelectedCellRanges()
      expect(ranges).toHaveLength(1)
      expect(Math.min(ranges[0]!.start.col, ranges[0]!.end.col)).toBe(3)
      expect(Math.max(ranges[0]!.start.col, ranges[0]!.end.col)).toBe(5)
      expect(Math.min(ranges[0]!.start.row, ranges[0]!.end.row)).toBe(0)
      expect(Math.max(ranges[0]!.start.row, ranges[0]!.end.row)).toBe(20)
      // 拖选过程中 selecting 边框应存在（回归：事后 updateCellSelectBorder 曾导致高亮全无）
      const selecting = (
        table as unknown as { scenegraph: { selectingRangeComponents: Map<string, unknown> } }
      ).scenegraph.selectingRangeComponents
      expect(selecting.size).toBeGreaterThan(0)

      sm.endSelectCells()
      table.fireListeners(ListTable.EVENT_TYPE.DRAG_SELECT_END, {})
      expect(sheet.getSelection().ranges).toEqual([parseRange('C1:E20')])
    } finally {
      grid.release()
    }
  })
})
