import { describe, expect, it, vi } from 'vite-plus/test'

import { Sheet } from '../../core/sheet'
import { createGrid, DEFAULT_ROW_HEIGHT, flushMicrotasks } from './grid-test-utils'

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
      expect(height!).toBeGreaterThan(DEFAULT_ROW_HEIGHT)
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

  it('显式换行符（\\n）触发估算撑开多行行高', async () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 'a\nb\nc\nd')
      await flushMicrotasks()
      expect(sheet.getRowHeight(0)!).toBeGreaterThan(DEFAULT_ROW_HEIGHT)
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
      expect(sheet.getRowHeight(1)).toBeGreaterThan(DEFAULT_ROW_HEIGHT)
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
      expect(merged).toBeGreaterThan(DEFAULT_ROW_HEIGHT)
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
      expect(sheet.getRowHeight(0) ?? DEFAULT_ROW_HEIGHT).toBe(DEFAULT_ROW_HEIGHT)
    } finally {
      grid.release()
    }
  })

  it('构造期短路：样式池无 wrap 样式时零全格行遍历（换行符候选也不触发扫描）', () => {
    const sheet = new Sheet()
    // 无任何样式：即使存在换行符格也不触发构造期扫描（动态写入路径另行重估）
    sheet.setCellValue({ row: 0, col: 0 }, 'a\nb\nc\nd')
    for (let row = 1; row < 100; row++) sheet.setCellValue({ row, col: 0 }, `plain-${row}`)
    const rowKeysSpy = vi.spyOn(sheet.store, 'rowKeys')
    const { grid } = createGrid({ sheet })
    try {
      expect(rowKeysSpy).not.toHaveBeenCalled()
      expect(sheet.getRowHeight(0)).toBeUndefined()
    } finally {
      grid.release()
    }
  })
})
