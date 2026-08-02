import { ListTable } from '@visactor/vtable'
import { describe, expect, it } from 'vitest'

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

describe('SheetGrid（happy-dom smoke）', () => {
  it('能挂载：列头 A..F + 行号列，坐标带偏移', () => {
    const { grid, table } = createGrid()
    try {
      // (0,*) 为行号列，(*,0) 为列头；模型 (0,0) → 表格 (1,1)
      expect(table.isSeriesNumber(0, 1)).toBe(true)
      expect(table.isHeader(1, 0)).toBe(true)
      expect(table.getCellValue(1, 0)).toBe('A')
    } finally {
      grid.release()
    }
  })

  it('模型 → 表格：setCellValue 后表格可见', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 'hello')
      expect(table.getCellValue(1, 1)).toBe('hello')
    } finally {
      grid.release()
    }
  })

  it('表格 → 模型：change_cell_value 回写 store', () => {
    const { sheet, grid, table } = createGrid()
    try {
      table.changeCellValue(2, 3, 'world', false, true)
      expect(sheet.getCellData({ row: 2, col: 1 })).toEqual({ v: 'world', t: 's' })
    } finally {
      grid.release()
    }
  })

  it('合并映射：customMergeCell 反映 MergeManager 的包围盒', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.mergeCells({ start: { row: 1, col: 1 }, end: { row: 2, col: 2 } })
      // 模型 B2:C3 → 表格坐标 (2..3, 2..3)
      const merge = table.getCustomMerge(3, 3)
      expect(merge?.range).toMatchObject({ start: { col: 2, row: 2 }, end: { col: 3, row: 3 } })
      expect(table.getCustomMerge(1, 1)).toBeUndefined()
    } finally {
      grid.release()
    }
  })

  it('合并区域是单一可操作单位：被覆盖格的 getCellRange 扩展为整个合并', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.setCellValue({ row: 1, col: 1 }, 'anchor-value')
      sheet.mergeCells({ start: { row: 1, col: 1 }, end: { row: 2, col: 2 } })

      // 点击被覆盖格（表格坐标 3,3）→ 选区/编辑范围 = 整个合并区域
      const range = table.getCellRange(3, 3)
      expect(range).toMatchObject({
        start: { col: 2, row: 2 },
        end: { col: 3, row: 3 },
        isCustom: true
      })

      // 合并格文本 = 锚点显示值（否则渲染为空）
      expect(table.getCustomMerge(3, 3)?.text).toBe('anchor-value')
      expect(table.getCustomMerge(2, 2)?.text).toBe('anchor-value')
    } finally {
      grid.release()
    }
  })

  it('编辑提交后合并格文本立即刷新（text 读 records，与 VTable 更新次序一致）', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.setCellValue({ row: 1, col: 1 }, 'old')
      sheet.mergeCells({ start: { row: 1, col: 1 }, end: { row: 2, col: 2 } })

      // 模拟编辑提交：doExit 的 isCustom 分支 → changeCellValue(锚点, 新值)
      const range = table.getCellRange(3, 3)
      table.changeCellValue(range.start.col, range.start.row, 'new')

      // 模型已回写；且重绘发生在 change_cell_value 之前，text 必须已是新值
      expect(sheet.getCellData({ row: 1, col: 1 })).toMatchObject({ v: 'new' })
      expect(table.getCustomMerge(3, 3)?.text).toBe('new')
    } finally {
      grid.release()
    }
  })

  it('编辑回写走命令系统：change_cell_value 后可 undo/redo', () => {
    const { sheet, grid, table } = createGrid()
    try {
      table.changeCellValue(1, 1, 'edited', false, true)
      expect(sheet.getCellData({ row: 0, col: 0 })).toEqual({ v: 'edited', t: 's' })

      expect(sheet.undo()).toBe(true)
      expect(sheet.getCellData({ row: 0, col: 0 })).toBeUndefined()

      expect(sheet.redo()).toBe(true)
      expect(sheet.getCellData({ row: 0, col: 0 })).toEqual({ v: 'edited', t: 's' })
    } finally {
      grid.release()
    }
  })

  it('拖选结束 → 模型选区同步为区域（合并工具的前提）', () => {
    const { sheet, grid, table } = createGrid()
    try {
      // 模拟 VTable 拖选结果（表格坐标含偏移：行号列 1 + 列头行 1）
      table.getSelectedCellRanges = () => [{ start: { col: 1, row: 1 }, end: { col: 3, row: 2 } }]
      table.fireListeners(ListTable.EVENT_TYPE.DRAG_SELECT_END, {})
      expect(sheet.getSelection().ranges[0]).toEqual({
        start: { row: 0, col: 0 },
        end: { row: 1, col: 2 }
      })
      expect(sheet.getSelection().activeCell).toEqual({ row: 0, col: 0 })
    } finally {
      grid.release()
    }
  })

  it('键盘绑定：Ctrl+Z undo、Ctrl+Shift+Z / Ctrl+Y redo；编辑器 input 不拦截', () => {
    const container = createContainer()
    const sheet = new Sheet()
    const grid = new SheetGrid({ container, sheet, rows: 20, cols: 6 })
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 'x')

      // Ctrl+Z → undo
      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
      )
      expect(sheet.getCellData({ row: 0, col: 0 })).toBeUndefined()

      // Ctrl+Shift+Z → redo
      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true })
      )
      expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'x' })

      // Ctrl+Z → undo；Ctrl+Y → redo
      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
      )
      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true })
      )
      expect(sheet.getCellData({ row: 0, col: 0 })).toMatchObject({ v: 'x' })

      // 事件来自编辑器 input（编辑中）→ 不拦截
      const input = document.createElement('input')
      container.appendChild(input)
      sheet.setCellValue({ row: 0, col: 1 }, 'y')
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }))
      expect(sheet.getCellData({ row: 0, col: 1 })).toMatchObject({ v: 'y' })
    } finally {
      grid.release()
    }
  })
})
