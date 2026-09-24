import { describe, expect, it } from 'vitest'

import { Sheet } from '../../core/sheet'
import { SHEET_DEFAULT_ROW_HEIGHT } from '../grid-theme'
import { createGrid, flushMicrotasks } from './grid-test-utils'

describe('wrap 行高引擎', () => {
  it('构造期估算：wrap 长文本行高按估算升高并落到引擎', () => {
    const sheet = new Sheet()
    sheet.setCellStyle(
      { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
      { align: { wrap: true } }
    )
    sheet.setCellValue({ row: 0, col: 0 }, 'x'.repeat(200))
    const { grid, table } = createGrid({ sheet })
    try {
      const height = sheet.getRowHeight(0)
      expect(height).not.toBeUndefined()
      expect(height!).toBeGreaterThan(SHEET_DEFAULT_ROW_HEIGHT)
      expect(table.getRowHeight(0)).toBe(height!)
    } finally {
      grid.release()
    }
  })

  it('只升不降：高于估算的人工/导入行高保留', () => {
    const sheet = new Sheet()
    sheet.setRowHeight(0, 600)
    sheet.setCellStyle(
      { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
      { align: { wrap: true } }
    )
    sheet.setCellValue({ row: 0, col: 0 }, 'x'.repeat(200))
    const { grid, table } = createGrid({ sheet })
    try {
      expect(sheet.getRowHeight(0)).toBe(600)
      expect(table.getRowHeight(0)).toBe(600)
    } finally {
      grid.release()
    }
  })

  it('显式换行符（\\n）触发估算撑开多行行高', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 0 }, 'a\nb\nc\nd')
    const { grid, table } = createGrid({ sheet })
    try {
      expect(sheet.getRowHeight(0)!).toBeGreaterThan(SHEET_DEFAULT_ROW_HEIGHT)
      expect(table.getRowHeight(0)).toBe(sheet.getRowHeight(0)!)
    } finally {
      grid.release()
    }
  })

  it('动态写入：wrap 格后写长文本 → cell-change 即期重估行高', async () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.setCellStyle(
        { start: { row: 1, col: 1 }, end: { row: 1, col: 1 } },
        { align: { wrap: true } }
      )
      sheet.setCellValue({ row: 1, col: 1 }, 'x'.repeat(200))
      await flushMicrotasks()
      expect(sheet.getRowHeight(1)).toBeGreaterThan(SHEET_DEFAULT_ROW_HEIGHT)
      expect(table.getRowHeight(1)).toBe(sheet.getRowHeight(1)!)
    } finally {
      grid.release()
    }
  })

  it('合并格跨列 wrap：按合并总宽度估算', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 0 }, 'x'.repeat(200))
    sheet.mergeCells({ start: { row: 0, col: 0 }, end: { row: 0, col: 2 } })
    sheet.setCellStyle(
      { start: { row: 0, col: 0 }, end: { row: 0, col: 2 } },
      { align: { wrap: true } }
    )
    const { grid } = createGrid({ sheet })
    try {
      // 单列（80px）估算约 5+ 行，3 列（240px）合并宽估算约 2 行——合并后明显更矮
      const merged = sheet.getRowHeight(0)!
      expect(merged).toBeGreaterThan(SHEET_DEFAULT_ROW_HEIGHT)
      expect(merged).toBeLessThan(200)
    } finally {
      grid.release()
    }
  })

  it('只扫有数据格：wrap 样式的空列不撑行高', () => {
    const sheet = new Sheet()
    sheet.setCellStyle(
      { start: { row: 0, col: 0 }, end: { row: 9, col: 0 } },
      { align: { wrap: true } }
    )
    const { grid } = createGrid({ sheet })
    try {
      // 无文本内容：估算不高于默认行高（宽表空列不参与扫描的性能口径）
      expect(sheet.getRowHeight(0) ?? SHEET_DEFAULT_ROW_HEIGHT).toBe(SHEET_DEFAULT_ROW_HEIGHT)
    } finally {
      grid.release()
    }
  })
})
