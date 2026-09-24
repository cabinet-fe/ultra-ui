import type { CellRenderer } from '@infinite-table/core'
import { describe, expect, it, vi } from 'vitest'

import { Sheet } from '../../core/sheet'
import { cellX, cellY, createGrid, fire, flushMicrotasks } from './grid-test-utils'

describe('SheetGrid 挂载与几何（happy-dom smoke）', () => {
  it('能挂载：行列头占位（drawRange 原点 = 行号列宽/列头高），列数随构造列定义', () => {
    const { grid, table } = createGrid()
    try {
      const drawRange = table.getDrawRange()
      expect(drawRange.x).toBe(46)
      expect(drawRange.y).toBe(28)
      expect(table.getHeaderLevelCount()).toBe(1)
      // 引擎表格列数 = 门面列数
      expect(table.getColWidth(5)).toBeGreaterThan(0)
      expect(table.getColWidth(6)).toBe(0)
    } finally {
      grid.release()
    }
  })

  it('showRowHeader/showColHeader 为 false 时内容原点回落 0（归一化零宽/零高）', () => {
    const { grid, table } = createGrid({ showRowHeader: false, showColHeader: false })
    try {
      const drawRange = table.getDrawRange()
      expect(drawRange.x).toBe(0)
      expect(drawRange.y).toBe(0)
    } finally {
      grid.release()
    }
  })

  it('窄 props + 宽数据高水位：构造时列数扩到模型声明列', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 9 }, 'J1')
    sheet.ensureTableSize(0, 10)
    const { grid, table } = createGrid({ sheet, rows: 5, cols: 3 })
    try {
      expect(table.getColWidth(9)).toBeGreaterThan(0)
      expect(table.getCellText(9, 0)).toBe('J1')
    } finally {
      grid.release()
    }
  })
})

describe('SheetGrid 数据面（模型直挂）', () => {
  it('模型 → 表格：setCellValue 后可见文本随模型事件局部刷新', () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.setCellValue({ row: 1, col: 2 }, 'hello')
      expect(table.getCellText(2, 1)).toBe('hello')
      sheet.setCellValue({ row: 1, col: 2 }, '')
      expect(table.getCellText(2, 1)).toBe('')
    } finally {
      grid.release()
    }
  })

  it('表格 → 模型：updateCell 回写 store 且走命令系统（可 undo）', () => {
    const { grid, table, sheet } = createGrid()
    try {
      table.updateCell(1, 1, 'grid-edited')
      expect(sheet.getCellData({ row: 1, col: 1 })?.v).toBe('grid-edited')
      expect(sheet.undo()).toBe(true)
      expect(sheet.getCellData({ row: 1, col: 1 })).toBeUndefined()
    } finally {
      grid.release()
    }
  })

  it('numFmt 仅作用于显示：数字按有效样式格式化，模型存原始值', () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.setCellStyle(
        { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
        { numFmt: { type: 'thousands' } }
      )
      sheet.setCellValue({ row: 0, col: 0 }, 12345.6)
      expect(table.getCellText(0, 0)).toBe('12,345.6')
      expect(sheet.getCellData({ row: 0, col: 0 })?.v).toBe(12345.6)
    } finally {
      grid.release()
    }
  })
})

describe('SheetGrid 合并与冻结', () => {
  it('合并映射：merge-change → 引擎合并生效，被覆盖格显示锚点文本；unmerge 恢复', async () => {
    const { grid, table, sheet } = createGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 'M')
      sheet.mergeCells({ start: { row: 0, col: 0 }, end: { row: 1, col: 1 } })
      await flushMicrotasks()
      expect(table.getCellText(0, 0)).toBe('M')
      // 被覆盖格路由主格（引擎 mergeCells 语义）
      expect(table.getCellText(1, 1)).toBe('M')

      sheet.unmergeCells({ start: { row: 0, col: 0 }, end: { row: 1, col: 1 } })
      await flushMicrotasks()
      sheet.setCellValue({ row: 1, col: 1 }, 'N')
      expect(table.getCellText(1, 1)).toBe('N')
    } finally {
      grid.release()
    }
  })

  it('冻结映射：模型冻结数即引擎数据冻结数（无行列头 ±1），frozen-change 即时生效', () => {
    const { grid, table, sheet } = createGrid()
    try {
      expect(table.getFrozenRowCount()).toBe(0)
      expect(table.getFrozenColCount()).toBe(0)
      sheet.setFrozen(2, 1)
      expect(table.getFrozenRowCount()).toBe(2)
      expect(table.getFrozenColCount()).toBe(1)
      sheet.setFrozen(0, 0)
      expect(table.getFrozenRowCount()).toBe(0)
      expect(table.getFrozenColCount()).toBe(0)
    } finally {
      grid.release()
    }
  })

  it('tab 重建还原：release 后按模型状态重建（冻结/值/合并）', async () => {
    const { container, grid: first, sheet } = createGrid()
    try {
      sheet.setFrozen(1, 1)
      sheet.setCellValue({ row: 0, col: 0 }, 'kept')
      sheet.setCellValue({ row: 2, col: 2 }, 'merged')
      sheet.mergeCells({ start: { row: 2, col: 2 }, end: { row: 3, col: 3 } })
      await flushMicrotasks()
      first.release()
      const rebuilt = createGrid({ sheet, container })
      try {
        expect(rebuilt.table.getFrozenRowCount()).toBe(1)
        expect(rebuilt.table.getFrozenColCount()).toBe(1)
        expect(rebuilt.table.getCellText(0, 0)).toBe('kept')
        expect(rebuilt.table.getCellText(3, 3)).toBe('merged')
      } finally {
        rebuilt.grid.release()
      }
    } finally {
      first.release()
    }
  })
})

describe('SheetGrid 右键菜单', () => {
  it('body 格：client 坐标 + 模型地址', async () => {
    const onContextMenu = vi.fn()
    const { grid, container } = createGrid({ onContextMenu })
    try {
      fire(container, 'contextmenu', { clientX: cellX(2), clientY: cellY(3) })
      await flushMicrotasks()
      expect(onContextMenu).toHaveBeenCalledWith({
        x: cellX(2),
        y: cellY(3),
        kind: 'body',
        addr: { row: 3, col: 2 }
      })
    } finally {
      grid.release()
    }
  })

  it('行号列 / 列头行 / 角点分流（角点归 body 且 addr 为 null）', async () => {
    const onContextMenu = vi.fn()
    const { grid, container } = createGrid({ onContextMenu })
    try {
      fire(container, 'contextmenu', { clientX: 10, clientY: cellY(1) })
      await flushMicrotasks()
      expect(onContextMenu).toHaveBeenLastCalledWith({
        x: 10,
        y: cellY(1),
        kind: 'row-header',
        addr: null,
        row: 1
      })

      fire(container, 'contextmenu', { clientX: cellX(2), clientY: 10 })
      await flushMicrotasks()
      expect(onContextMenu).toHaveBeenLastCalledWith({
        x: cellX(2),
        y: 10,
        kind: 'col-header',
        addr: null,
        col: 2
      })

      fire(container, 'contextmenu', { clientX: 10, clientY: 10 })
      await flushMicrotasks()
      expect(onContextMenu).toHaveBeenLastCalledWith({ x: 10, y: 10, kind: 'body', addr: null })
    } finally {
      grid.release()
    }
  })
})

describe('SheetGrid 键盘', () => {
  it('Ctrl+Z 撤销 / Ctrl+Shift+Z 重做（模型命令栈）；编辑器输入不拦截', () => {
    const { grid, container, sheet } = createGrid()
    try {
      sheet.setCellValue({ row: 1, col: 1 }, 'x')
      const undo = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
      container.dispatchEvent(undo)
      expect(sheet.getCellData({ row: 1, col: 1 })).toBeUndefined()
      const redo = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      })
      container.dispatchEvent(redo)
      expect(sheet.getCellData({ row: 1, col: 1 })?.v).toBe('x')
    } finally {
      grid.release()
    }
  })

  it('Ctrl+A 全选：画布选区与模型选区同步为全表', () => {
    const { grid, container, table, sheet } = createGrid({ rows: 10, cols: 5 })
    try {
      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true })
      )
      const ranges = table.getSelectedCellRanges()
      expect(ranges[0]).toMatchObject({ start: { col: 0, row: 0 }, end: { col: 4, row: 9 } })
      expect(sheet.getSelection().ranges[0]).toMatchObject({
        start: { row: 0, col: 0 },
        end: { row: 9, col: 4 }
      })
    } finally {
      grid.release()
    }
  })
})

describe('SheetGrid 编辑生命周期与 hooks', () => {
  it('onEditStart / onEditEnd 随编辑会话触发（携带模型地址）', () => {
    const onEditStart = vi.fn()
    const onEditEnd = vi.fn()
    const { grid, table, sheet } = createGrid({ onEditStart, onEditEnd })
    try {
      sheet.setCellValue({ row: 1, col: 1 }, 'before')
      expect(table.startEdit(1, 1)).toBe(true)
      expect(onEditStart).toHaveBeenCalledWith({ row: 1, col: 1 })
      table.commitEdit()
      expect(onEditEnd).toHaveBeenCalledWith({ row: 1, col: 1 })
      expect(table.isEditing()).toBe(false)
    } finally {
      grid.release()
    }
  })

  it('resolveDisplayValue 覆盖显示；不写模型 v', () => {
    const { grid, table, sheet } = createGrid({
      resolveDisplayValue: (addr) => (addr.row === 0 && addr.col === 0 ? '占位' : undefined)
    })
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 5)
      expect(table.getCellText(0, 0)).toBe('占位')
      expect(sheet.getCellData({ row: 0, col: 0 })?.v).toBe(5)
    } finally {
      grid.release()
    }
  })

  it('resolveCellStyle 按格叠加动态样式（渲染热路径调用，不写 CellData.s）', () => {
    const resolveCellStyle = vi.fn(() => ({ fill: { color: '#FF0000' } }))
    const { grid, sheet } = createGrid({ resolveCellStyle })
    try {
      expect(resolveCellStyle).toHaveBeenCalled()
      expect(sheet.getCellData({ row: 0, col: 0 })?.s).toBeUndefined()
    } finally {
      grid.release()
    }
  })

  it('resolveCellRenderer 按格分发（引擎布局期回调数据格）', () => {
    const resolveCellRenderer = vi.fn((): CellRenderer | undefined => undefined)
    const { grid } = createGrid({ resolveCellRenderer })
    try {
      expect(resolveCellRenderer).toHaveBeenCalled()
      // 仅数据格进入分发器（无行列头负坐标）
      for (const [addr] of resolveCellRenderer.mock.calls) {
        expect(addr.col).toBeGreaterThanOrEqual(0)
        expect(addr.row).toBeGreaterThanOrEqual(0)
      }
    } finally {
      grid.release()
    }
  })
})

describe('SheetGrid LRU 可见性', () => {
  it('隐藏期间停用同步（只置脏），激活时一次性全量同步', async () => {
    const { grid, table, sheet } = createGrid()
    try {
      grid.setVisible(false)
      sheet.mergeCells({ start: { row: 0, col: 0 }, end: { row: 0, col: 1 } })
      await flushMicrotasks()
      grid.setVisible(true)
      // 激活后合并生效：B1（col 1 被覆盖格）显示锚点文本
      sheet.setCellValue({ row: 0, col: 0 }, 'LRU')
      expect(table.getCellText(1, 0)).toBe('LRU')
    } finally {
      grid.release()
    }
  })
})

describe('SheetGrid 命中与资源释放', () => {
  it('hitTestSheetAddr：数据格命中模型地址，行列头/空白返回 null', () => {
    const { grid } = createGrid()
    try {
      expect(grid.hitTestSheetAddr(cellX(1), cellY(2))).toEqual({ row: 2, col: 1 })
      expect(grid.hitTestSheetAddr(10, cellY(2))).toBeNull()
      expect(grid.hitTestSheetAddr(cellX(1), 10)).toBeNull()
    } finally {
      grid.release()
    }
  })

  it('release 幂等；destroy 等价 release', () => {
    const { grid } = createGrid()
    grid.release()
    expect(() => grid.release()).not.toThrow()
    const { grid: grid2 } = createGrid()
    grid2.destroy()
    expect(() => grid2.destroy()).not.toThrow()
  })
})
