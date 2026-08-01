import { describe, expect, it } from 'vitest'

import { Sheet } from '../core/sheet'
import { SheetGrid } from './sheet-grid'

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
})
