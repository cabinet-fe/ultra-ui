import { describe, expect, it } from 'vite-plus/test'

import type { CellRange } from '../../core/address'
import { createGrid } from './grid-test-utils'

/** 单格区域便捷形态 */
function range(row: number, col: number): CellRange {
  return { start: { row, col }, end: { row, col } }
}

describe('模型样式 → 引擎样式映射（经 SheetGrid 公共面）', () => {
  it('填充色 → background', () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.setCellStyle(range(0, 0), { fill: { color: '#FF0000' } })
      expect(table.resolveStyle(0, 0).background).toBe('#FF0000')
    } finally {
      grid.release()
    }
  })

  it('font 映射：颜色/加粗/斜体/下划线/删除线；字号 pt→px（12pt → 16px）', () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.setCellStyle(range(0, 0), {
        font: {
          color: '#333333',
          bold: true,
          italic: true,
          underline: true,
          strikethrough: true,
          size: 12
        }
      })
      const style = table.resolveStyle(0, 0)
      expect(style.color).toBe('#333333')
      expect(style.fontWeight).toBe('bold')
      expect(style.fontStyle).toBe('italic')
      expect(style.underline).toBe(true)
      expect(style.lineThrough).toBe(true)
      expect(style.fontSize).toBe(16)
    } finally {
      grid.release()
    }
  })

  it('align 映射：水平/垂直/换行（wrap → textWrap）', () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.setCellStyle(range(0, 0), {
        align: { horizontal: 'center', vertical: 'top', wrap: true }
      })
      const style = table.resolveStyle(0, 0)
      expect(style.textAlign).toBe('center')
      expect(style.verticalAlign).toBe('top')
      expect(style.textWrap).toBe(true)
    } finally {
      grid.release()
    }
  })

  it('边框逐边映射：thin/medium/thick → solid（宽度独立），dashed/dotted 保留', () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.setCellStyle(range(0, 0), {
        border: {
          top: { style: 'thin', width: 1, color: '#000000' },
          right: { style: 'medium', width: 2, color: '#111111' },
          bottom: { style: 'dashed', width: 1, color: '#222222' },
          left: { style: 'dotted', width: 1, color: '#333333' }
        }
      })
      expect(table.resolveStyle(0, 0).border).toEqual({
        top: { width: 1, color: '#000000', style: 'solid' },
        right: { width: 2, color: '#111111', style: 'solid' },
        bottom: { width: 1, color: '#222222', style: 'dashed' },
        left: { width: 1, color: '#333333', style: 'dotted' }
      })
    } finally {
      grid.release()
    }
  })

  it('thick 实线：宽度由边定义携带，线型归一为 solid', () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.setCellStyle(range(0, 0), {
        border: { top: { style: 'thick', width: 3, color: '#444444' } }
      })
      expect(table.resolveStyle(0, 0).border?.top).toEqual({
        width: 3,
        color: '#444444',
        style: 'solid'
      })
    } finally {
      grid.release()
    }
  })
})
