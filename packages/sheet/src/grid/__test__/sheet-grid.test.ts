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

  it('主题与交互选项：fillHandle / rowResize / clip / 编辑态方向键不换格', () => {
    const { grid, table } = createGrid()
    try {
      const options = table.options
      expect(options.excelOptions?.fillHandle).toBe(true)
      expect(options.resize?.columnResizeMode).toBe('header')
      expect(options.resize?.rowResizeMode).toBe('all')
      // 列宽：仅列头；行高：仅行号列（body 格不可拖，避免干扰选区/编辑）
      expect(table._canResizeColumn(1, 0)).toBe(true) // 列头 A
      expect(table._canResizeColumn(1, 1)).toBe(false) // body
      expect(table.isSeriesNumber(0, 1)).toBe(true)
      expect(table._canResizeRow(0, 1)).toBe(true) // 行号列
      expect(table._canResizeRow(1, 1)).toBe(false) // body
      expect(options.keyboardOptions?.moveEditCellOnArrowKeys).toBe(false)
      expect(options.defaultRowHeight).toBe(28)
      expect(options.eventOptions?.preventDefaultContextMenu).toBe(true)
      // theme 为 TableTheme 实例（DEFAULT.extends），读运行时解析值
      const theme = table.theme
      expect(theme.bodyStyle?.bgColor).toBe('#FFF')
      expect(theme.bodyStyle?.textOverflow).toBe('clip')
      expect(theme.defaultStyle?.textOverflow).toBe('clip')
      expect(theme.defaultStyle?.borderColor).toBe('#E1E4E8')
      // VTable DEFAULT 为 [10,16,10,16]；收紧后贴近 Excel
      expect(theme.defaultStyle?.padding).toEqual([2, 6, 2, 6])
      expect(theme.bodyStyle?.padding).toEqual([2, 6, 2, 6])
      expect(theme.frameStyle?.borderColor).toBe('#E1E4E8')
      expect(theme.selectionStyle?.cellBorderColor).toBe('#2170E7')
      expect(theme.selectionStyle?.cellBorderColor).not.toBe('#000')
      expect(options.rowSeriesNumber).toMatchObject({
        width: 46,
        style: { bgColor: '#F5F5F5', padding: [2, 6, 2, 6], textOverflow: 'clip' }
      })
    } finally {
      grid.release()
    }
  })

  it('右键 CONTEXTMENU_CELL → onContextMenu（client 坐标 + 模型地址）', async () => {
    const sheet = new Sheet()
    const container = createContainer()
    const calls: Array<{ x: number; y: number; addr: { row: number; col: number } | null }> = []
    const grid = new SheetGrid({
      container,
      sheet,
      rows: 20,
      cols: 6,
      onContextMenu: (info) => calls.push(info)
    })
    try {
      const table = grid.getTable()
      // 表格坐标 (2,3) → 模型 B3（colOffset/rowOffset 各 1）
      table.fireListeners(ListTable.EVENT_TYPE.CONTEXTMENU_CELL, {
        col: 2,
        row: 3,
        event: { clientX: 120, clientY: 80, preventDefault() {} }
      })
      await Promise.resolve() // queueMicrotask
      expect(calls).toHaveLength(1)
      expect(calls[0]).toMatchObject({ x: 120, y: 80, addr: { row: 2, col: 1 } })
    } finally {
      grid.release()
    }
  })

  it('行高：RESIZE_ROW_END 写入 Sheet，重建后还原', () => {
    const container = createContainer()
    const sheet = new Sheet()
    let grid = new SheetGrid({ container, sheet, rows: 20, cols: 6 })
    try {
      grid.getTable().fireListeners(ListTable.EVENT_TYPE.RESIZE_ROW_END, { row: 2, rowHeight: 48 })
      expect(sheet.getRowHeight(1)).toBe(48)

      grid.release()
      grid = new SheetGrid({ container, sheet, rows: 20, cols: 6 })
      expect(grid.getTable().getRowHeight(2)).toBe(48)
    } finally {
      grid.release()
    }
  })

  it('填充柄：DRAG_FILL_HANDLE_END 数字序列写入模型', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, 1)
      sheet.selectRange({ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } })
      // 模拟源选区（表格坐标含偏移）
      table.getSelectedCellRanges = () => [{ start: { col: 1, row: 1 }, end: { col: 1, row: 1 } }]
      table.fireListeners(ListTable.EVENT_TYPE.MOUSEDOWN_FILL_HANDLE, {})
      // 拖到底部扩展至 A1:A3
      table.getSelectedCellRanges = () => [{ start: { col: 1, row: 1 }, end: { col: 1, row: 3 } }]
      table.fireListeners(ListTable.EVENT_TYPE.DRAG_FILL_HANDLE_END, { direction: 'bottom' })
      expect(sheet.getCellData({ row: 1, col: 0 })?.v).toBe(2)
      expect(sheet.getCellData({ row: 2, col: 0 })?.v).toBe(3)
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

  it('列 style 回调：按 StyleId 从样式池解析 VTable 样式（bgColor / 四边边框）', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.setCellStyle(
        { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
        {
          fill: { color: '#FF0000' },
          border: {
            top: { style: 'thin', width: 1, color: '#000000' },
            left: { style: 'dotted', width: 2, color: '#00FF00' }
          }
        }
      )
      // 从列定义取 style 回调（表格坐标 (1,1) = 模型 A1；行号列/列头各偏移 1）
      const column = table.getBodyColumnDefine(1, 1) as { style?: unknown }
      const styleFn = column.style as (arg: {
        row: number
        col: number
        table: unknown
      }) => Record<string, unknown>
      const result = styleFn({ row: 1, col: 1, table })
      expect(result.bgColor).toBe('#FF0000')
      // 四边数组顺序 [top, right, bottom, left]
      expect(result.borderColor).toEqual(['#000000', null, null, '#00FF00'])
      expect(result.borderLineWidth).toEqual([1, null, null, 2])
      expect(result.borderLineDash).toEqual([null, null, null, [1, 2]])

      // 无样式格 → 空对象（回落主题默认）
      expect(styleFn({ row: 2, col: 2, table })).toEqual({})

      // 合并格：被覆盖格解析到锚点样式
      sheet.mergeCells({ start: { row: 0, col: 0 }, end: { row: 1, col: 1 } })
      expect(styleFn({ row: 2, col: 2, table }).bgColor).toBe('#FF0000')
    } finally {
      grid.release()
    }
  })

  it('样式变化复用 cell-change → updateCellContent 重绘；undo 同步回退', () => {
    const { sheet, grid, table } = createGrid()
    try {
      const spy = vi.spyOn(table, 'updateCellContent')
      sheet.setCellStyle(
        { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
        { fill: { color: '#FF0000' } }
      )
      expect(spy).toHaveBeenCalledWith(1, 1)

      sheet.undo()
      expect(spy).toHaveBeenCalledTimes(2)
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

  it('窄 props + 宽数据高水位：构造时列数扩到 store 覆盖列', () => {
    const sheet = new Sheet()
    // 写入第 15 列（0-based 14）→ colCount = 15；props.cols=6 不应卡住渲染
    sheet.setCellValue({ row: 0, col: 14 }, 'far')
    const grid = new SheetGrid({ container: createContainer(), sheet, rows: 10, cols: 6 })
    try {
      const table = grid.getTable()
      // 列头：行号列 + A..O（15 列）→ 表格列索引 15 为 O
      expect(table.getCellValue(15, 0)).toBe('O')
      expect(table.getCellValue(15, 1)).toBe('far')
      expect(sheet.cols).toBeGreaterThanOrEqual(15)
    } finally {
      grid.release()
    }
  })
})
