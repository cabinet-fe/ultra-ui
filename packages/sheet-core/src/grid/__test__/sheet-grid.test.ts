import { ListTable } from '@visactor/vtable'
import { describe, expect, it } from 'vitest'

import { Sheet } from '../../core/sheet'
import {
  SheetGrid,
  cellStyleToVTableStyle,
  estimateWrapRowHeight,
  fontSizePtToPx
} from '../sheet-grid'

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

/** 当前编辑器 input（容器里另有 VTable 内部 input，不能靠 querySelector 取） */
function editorInput(table: ListTable): HTMLInputElement | undefined {
  const manager = (
    table as unknown as {
      editorManager?: { editingEditor?: { getInputElement?: () => HTMLInputElement } }
    }
  ).editorManager
  return manager?.editingEditor?.getInputElement?.()
}

function columnStyleFn(table: ListTable) {
  const column = table.getBodyColumnDefine(1, 1) as { style?: unknown }
  return column.style as (arg: {
    row: number
    col: number
    table: unknown
  }) => Record<string, unknown>
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

  it('showRowHeader/showColHeader 为 false 时不渲染行号列与列头', () => {
    const sheet = new Sheet()
    sheet.setCellValue({ row: 0, col: 0 }, 'hello')
    const grid = new SheetGrid({
      container: createContainer(),
      sheet,
      rows: 3,
      cols: 2,
      showRowHeader: false,
      showColHeader: false
    })
    try {
      const table = grid.getTable()
      expect(table.options.showHeader).toBe(false)
      expect(table.options.rowSeriesNumber).toBeUndefined()
      expect(table.columnHeaderLevelCount).toBe(0)
      expect(table.isSeriesNumber(0, 0)).toBe(false)
      expect(table.rowCount).toBe(3)
      expect(table.colCount).toBe(2)
      // 无偏移：表格 (0,0) 即模型 A1
      expect(table.getCellValue(0, 0)).toBe('hello')
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
      expect(options.hover?.disableHover).toBe(true)
      expect(options.hover?.disableHeaderHover).not.toBe(true)
      // theme 为 TableTheme 实例（DEFAULT.extends），读运行时解析值
      const theme = table.theme
      expect(theme.bodyStyle?.bgColor).toBe('#FFF')
      expect(theme.bodyStyle?.textOverflow).toBe('ellipsis')
      expect(theme.defaultStyle?.textOverflow).toBe('ellipsis')
      expect(theme.defaultStyle?.borderColor).toBe('#E1E4E8')
      // VTable DEFAULT 为 [10,16,10,16]；收紧后贴近 Excel
      expect(theme.defaultStyle?.padding).toEqual([2, 6, 2, 6])
      expect(theme.bodyStyle?.padding).toEqual([2, 6, 2, 6])
      expect(theme.frameStyle?.borderColor).toBe('#E1E4E8')
      expect(theme.selectionStyle?.cellBorderColor).toBe('#2170E7')
      expect(theme.selectionStyle?.cellBorderColor).not.toBe('#000')
      // 右/下边框描边收入本格格内（修「外边框右边/下边被邻居填充盖住」）
      expect(theme.cellBorderClipDirection).toBe('bottom-right')
      expect(theme.headerStyle?.textAlign).toBe('center')
      expect(theme.headerStyle?.fontWeight).toBe('normal')
      expect(theme.headerStyle?.fontSize).toBe(12)
      expect(theme.rowHeaderStyle?.textAlign).toBe('center')
      expect(theme.rowHeaderStyle?.fontWeight).toBe('normal')
      expect(theme.cornerHeaderStyle?.fontWeight).toBe('normal')
      expect(options.rowSeriesNumber).toMatchObject({
        width: 46,
        style: {
          bgColor: '#F5F5F5',
          padding: [2, 6, 2, 6],
          textOverflow: 'ellipsis',
          textAlign: 'center',
          fontWeight: 'normal',
          fontSize: 12
        }
      })
    } finally {
      grid.release()
    }
  })

  it('右键 CONTEXTMENU_CELL → onContextMenu（client 坐标 + 模型地址）', async () => {
    const sheet = new Sheet()
    const container = createContainer()
    const calls: Array<{
      x: number
      y: number
      kind: string
      addr: { row: number; col: number } | null
      row?: number
      col?: number
    }> = []
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
      expect(calls[0]).toMatchObject({ x: 120, y: 80, kind: 'body', addr: { row: 2, col: 1 } })

      // 行号列 (0, 4) → row-header 模型行 3
      table.fireListeners(ListTable.EVENT_TYPE.CONTEXTMENU_CELL, {
        col: 0,
        row: 4,
        event: { clientX: 10, clientY: 100, preventDefault() {} }
      })
      await Promise.resolve()
      expect(calls[1]).toMatchObject({ kind: 'row-header', addr: null, row: 3 })

      // 列头 (3, 0) → col-header 模型列 2
      table.fireListeners(ListTable.EVENT_TYPE.CONTEXTMENU_CELL, {
        col: 3,
        row: 0,
        event: { clientX: 200, clientY: 5, preventDefault() {} }
      })
      await Promise.resolve()
      expect(calls[2]).toMatchObject({ kind: 'col-header', addr: null, col: 2 })

      // 角点 (0, 0) = 行号列 × 列头 → body（addr null），保留当前选区语义
      table.fireListeners(ListTable.EVENT_TYPE.CONTEXTMENU_CELL, {
        col: 0,
        row: 0,
        event: { clientX: 5, clientY: 5, preventDefault() {} }
      })
      await Promise.resolve()
      expect(calls[3]).toMatchObject({ kind: 'body', addr: null })
      expect(calls[3]).not.toHaveProperty('row')
      expect(calls[3]).not.toHaveProperty('col')
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

  it('列宽：RESIZE_COLUMN_END 写入 Sheet，重建后还原', () => {
    const container = createContainer()
    const sheet = new Sheet()
    let grid = new SheetGrid({ container, sheet, rows: 20, cols: 6 })
    try {
      grid
        .getTable()
        .fireListeners(ListTable.EVENT_TYPE.RESIZE_COLUMN_END, {
          col: 2,
          colWidths: [46, 80, 140, 80, 80, 80]
        })
      expect(sheet.getColWidth(1)).toBe(140)

      grid.release()
      grid = new SheetGrid({ container, sheet, rows: 20, cols: 6 })
      expect(grid.getTable().getColWidth(2)).toBe(140)
    } finally {
      grid.release()
    }
  })

  it('超出渲染列的列宽不撑开 VTable，构造仍按 column.width 还原可见列', () => {
    const container = createContainer()
    const sheet = new Sheet()
    sheet.ensureTableSize(20, 6)
    for (let col = 0; col < 120; col++) sheet.setColWidth(col, 69)
    const grid = new SheetGrid({ container, sheet, rows: 20, cols: 6 })
    try {
      const table = grid.getTable()
      expect(table.colCount).toBe(7)
      expect(table.getColWidth(2)).toBe(69)
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
      grid.flushPending()
      expect(table.getCellValue(1, 1)).toBe('hello')
    } finally {
      grid.release()
    }
  })

  it('列 style 回调：按 StyleId 从样式池解析 VTable 样式（bgColor / 四边边框 / 网格线回落）', () => {
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
      // 四边数组顺序 [top, right, bottom, left]；未自定义的边回落网格线（#E1E4E8 / 1px）
      expect(result.borderColor).toEqual(['#000000', '#E1E4E8', '#E1E4E8', '#00FF00'])
      expect(result.borderLineWidth).toEqual([1, 1, 1, 2])
      expect(result.borderLineDash).toEqual([null, null, null, [1, 2]])

      // 无样式格（邻居无自定义对侧边）→ 空对象（回落主题统一网格线）
      expect(styleFn({ row: 2, col: 2, table })).toEqual({})

      // 合并格：被覆盖格解析到锚点样式
      sheet.mergeCells({ start: { row: 0, col: 0 }, end: { row: 1, col: 1 } })
      expect(styleFn({ row: 2, col: 2, table }).bgColor).toBe('#FF0000')
    } finally {
      grid.release()
    }
  })

  it('列 style 回调：仅填充色网格线不丢失；共享边双向溯源（邻居对侧边补位）', () => {
    const { sheet, grid, table } = createGrid()
    try {
      // A1 仅填充 → 四边回落网格线（根因 A：只设填充色时网格线丢失）
      sheet.setCellStyle(
        { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
        { fill: { color: '#FF0000' } }
      )
      // C1 自定义右边（共享边权威数据在 C1.right）
      sheet.setCellStyle(
        { start: { row: 0, col: 2 }, end: { row: 0, col: 2 } },
        { border: { right: { style: 'thin', width: 1, color: '#000000' } } }
      )
      // B1 自定义左边（验证对向溯源：A1.right 未设时应取 B1.left）
      sheet.setCellStyle(
        { start: { row: 0, col: 1 }, end: { row: 0, col: 1 } },
        { border: { left: { style: 'dashed', width: 1, color: '#111111' } } }
      )
      const column = table.getBodyColumnDefine(1, 1) as { style?: unknown }
      const styleFn = column.style as (arg: {
        row: number
        col: number
        table: unknown
      }) => Record<string, unknown>

      const filled = styleFn({ row: 1, col: 1, table })
      expect(filled.bgColor).toBe('#FF0000')
      // A1：上/下网格线；右边溯源 B1.left（dashed #111111）；左边网格线（越界无邻居）
      expect(filled.borderColor).toEqual(['#E1E4E8', '#111111', '#E1E4E8', '#E1E4E8'])
      expect(filled.borderLineWidth).toEqual([1, 1, 1, 1])
      expect(filled.borderLineDash).toEqual([null, [4, 2], null, null])

      // C1 自身：right 自定义，其余边回落网格线（左邻居 B1 无自定义 right）
      const custom = styleFn({ row: 1, col: 3, table })
      expect(custom.borderColor).toEqual(['#E1E4E8', '#000000', '#E1E4E8', '#E1E4E8'])

      // D1（无样式）：左边溯源左邻居 C1 的自定义 right；其余边回落网格线
      const neighbor = styleFn({ row: 1, col: 4, table })
      expect(neighbor.bgColor).toBeUndefined()
      expect(neighbor.borderColor).toEqual(['#E1E4E8', '#E1E4E8', '#E1E4E8', '#000000'])
      expect(neighbor.borderLineWidth).toEqual([1, 1, 1, 1])
    } finally {
      grid.release()
    }
  })

  it('合并锚点 facing 跳过合并跨度：右/下外缘不镜像左/上边框', () => {
    const { sheet, grid, table } = createGrid()
    try {
      // 横向合并 A1:B1 + 锚点仅左边红框 → 右外缘（B1|C1 边界）不得镜像红色
      sheet.mergeCells({ start: { row: 0, col: 0 }, end: { row: 0, col: 1 } })
      sheet.setCellStyle(
        { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
        { border: { left: { style: 'thin', width: 1, color: '#FF0000' } } }
      )
      const column = table.getBodyColumnDefine(1, 1) as { style?: unknown }
      const styleFn = column.style as (arg: {
        row: number
        col: number
        table: unknown
      }) => Record<string, unknown>

      const anchor = styleFn({ row: 1, col: 1, table })
      expect(anchor.borderColor).toEqual(['#E1E4E8', '#E1E4E8', '#E1E4E8', '#FF0000'])

      // 合并区外邻居 C1 有自定义左边 → 锚点右外缘溯源到它（而非镜像或网格线）
      sheet.setCellStyle(
        { start: { row: 0, col: 2 }, end: { row: 0, col: 2 } },
        { border: { left: { style: 'thin', width: 1, color: '#00FF00' } } }
      )
      expect(styleFn({ row: 1, col: 1, table }).borderColor).toEqual([
        '#E1E4E8',
        '#00FF00',
        '#E1E4E8',
        '#FF0000'
      ])

      // 纵向合并 A3:A4 + 锚点仅上边红框 → 下外缘（A4|A5 边界）不得镜像红色
      sheet.mergeCells({ start: { row: 2, col: 0 }, end: { row: 3, col: 0 } })
      sheet.setCellStyle(
        { start: { row: 2, col: 0 }, end: { row: 2, col: 0 } },
        { border: { top: { style: 'thin', width: 1, color: '#FF0000' } } }
      )
      const vAnchor = styleFn({ row: 3, col: 1, table })
      expect(vAnchor.borderColor).toEqual(['#FF0000', '#E1E4E8', '#E1E4E8', '#E1E4E8'])

      // 合并区外邻居 A5 有自定义上边 → 锚点下外缘溯源到它
      sheet.setCellStyle(
        { start: { row: 4, col: 0 }, end: { row: 4, col: 0 } },
        { border: { top: { style: 'thin', width: 1, color: '#0000FF' } } }
      )
      expect(styleFn({ row: 3, col: 1, table }).borderColor).toEqual([
        '#FF0000',
        '#E1E4E8',
        '#0000FF',
        '#E1E4E8'
      ])
    } finally {
      grid.release()
    }
  })

  it('样式变化复用 cell-change → updateCellContent 重绘（含四邻共享边刷新）；undo 同步回退', () => {
    const { sheet, grid, table } = createGrid()
    try {
      const spy = vi.spyOn(table, 'updateCellContent')
      sheet.setCellStyle(
        { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
        { fill: { color: '#FF0000' } }
      )
      grid.flushPending()
      // 本格 (1,1) + 四邻（共享边双向溯源：邻居渲染依赖本格边框）
      expect(spy).toHaveBeenCalledWith(1, 1)
      expect(spy).toHaveBeenCalledWith(2, 1)
      expect(spy).toHaveBeenCalledWith(1, 2)
      // A1 在边角：左/上越界，只刷新右/下邻居，共 3 次
      expect(spy).toHaveBeenCalledTimes(3)

      spy.mockClear()
      sheet.undo()
      grid.flushPending()
      expect(spy).toHaveBeenCalledTimes(3)
    } finally {
      grid.release()
    }
  })

  it('合并格样式变化：重绘覆盖合并区全部底层位置（含被覆盖格场景节点）', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.mergeCells({ start: { row: 1, col: 1 }, end: { row: 1, col: 2 } })
      const spy = vi.spyOn(table, 'updateCellContent')
      spy.mockClear()
      sheet.setCellStyle(
        { start: { row: 1, col: 1 }, end: { row: 1, col: 1 } },
        { border: { left: { style: 'thin', width: 1, color: '#FF0000' } } }
      )
      grid.flushPending()
      // 锚点 (2,2) 与被覆盖格 (3,2) 都重建（合并区每位置各持一个场景分组）
      expect(spy).toHaveBeenCalledWith(2, 2)
      expect(spy).toHaveBeenCalledWith(3, 2)
      // 四侧消费方（覆盖合并跨度）：左 (1,2)、右跳过合并跨度到 (4,2)、
      // 上按列跨度 (2,1)/(3,1)、下按列跨度 (2,3)/(3,3)
      expect(spy).toHaveBeenCalledWith(1, 2)
      expect(spy).toHaveBeenCalledWith(4, 2)
      expect(spy).toHaveBeenCalledWith(2, 1)
      expect(spy).toHaveBeenCalledWith(3, 1)
      expect(spy).toHaveBeenCalledWith(2, 3)
      expect(spy).toHaveBeenCalledWith(3, 3)
    } finally {
      grid.release()
    }
  })

  it('2x2 合并格样式变化：消费方按行/列跨度完整枚举（覆盖段邻居也重绘）', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.mergeCells({ start: { row: 1, col: 1 }, end: { row: 2, col: 2 } })
      grid.flushPending()
      const spy = vi.spyOn(table, 'updateCellContent')
      spy.mockClear()
      sheet.setCellStyle(
        { start: { row: 1, col: 1 }, end: { row: 1, col: 1 } },
        { border: { left: { style: 'thin', width: 1, color: '#FF0000' } } }
      )
      grid.flushPending()
      // 合并区 2x2 全部底层位置重建
      for (const [col, row] of [
        [2, 2],
        [3, 2],
        [2, 3],
        [3, 3]
      ]) {
        expect(spy).toHaveBeenCalledWith(col, row)
      }
      // 左/右消费方按行跨度（row 1..2 → 表格行 2..3）：(1,2)/(1,3)、(4,2)/(4,3)
      expect(spy).toHaveBeenCalledWith(1, 2)
      expect(spy).toHaveBeenCalledWith(1, 3)
      expect(spy).toHaveBeenCalledWith(4, 2)
      expect(spy).toHaveBeenCalledWith(4, 3)
      // 上/下消费方按列跨度（col 1..2 → 表格列 2..3）：(2,1)/(3,1)、(2,4)/(3,4)
      expect(spy).toHaveBeenCalledWith(2, 1)
      expect(spy).toHaveBeenCalledWith(3, 1)
      expect(spy).toHaveBeenCalledWith(2, 4)
      expect(spy).toHaveBeenCalledWith(3, 4)
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
      grid.flushPending()

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

  it('删行后以模型尺寸重建：不被更大的 options.rows 撑回', () => {
    const sheet = new Sheet()
    const first = new SheetGrid({ container: createContainer(), sheet, rows: 10, cols: 6 })
    first.release()
    expect(sheet.rows).toBe(10)

    sheet.deleteRows(0, 2)
    expect(sheet.rows).toBe(8)

    // 模拟错误传入旧 props（10）：ensureTableSize 会扩张，故调用方须传模型尺寸。
    // 正确路径：传入 sheet.rows，重建后行数保持删除结果。
    const second = new SheetGrid({
      container: createContainer(),
      sheet,
      rows: sheet.rows,
      cols: sheet.cols
    })
    try {
      expect(sheet.rows).toBe(8)
      // 列头 1 行 + 8 body
      expect(second.getTable().rowCount).toBe(9)
    } finally {
      second.release()
    }
  })

  it('cellStyleToVTableStyle：font/align 映射 + 字号 pt→px；wrap 行高估算', () => {
    expect(fontSizePtToPx(12)).toBe(16)
    expect(
      cellStyleToVTableStyle({
        font: {
          color: '#FF0000',
          bold: true,
          italic: true,
          underline: true,
          strikethrough: true,
          size: 12
        },
        align: { horizontal: 'center', vertical: 'middle', wrap: true }
      })
    ).toMatchObject({
      color: '#FF0000',
      fontWeight: 'bold',
      fontStyle: 'italic',
      underline: true,
      lineThrough: true,
      fontSize: 16,
      textAlign: 'center',
      textBaseline: 'middle',
      autoWrapText: true
    })

    const short = estimateWrapRowHeight({ text: 'hi', colWidth: 100, fontSizePt: 11 })
    expect(short).toBe(28) // 默认行高
    const tall = estimateWrapRowHeight({
      text: '一二三四五六七八九十'.repeat(8),
      colWidth: 80,
      fontSizePt: 11
    })
    expect(tall).toBeGreaterThan(28)
  })

  it('wrap 样式写入后行高随估算升高', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.setCellValue({ row: 0, col: 0 }, '一二三四五六七八九十'.repeat(6))
      sheet.setCellStyle(
        { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
        { align: { wrap: true } }
      )
      grid.flushPending()
      const height = sheet.getRowHeight(0)
      expect(height).toBeGreaterThan(28)
      expect(table.getRowHeight(1)).toBe(height)
    } finally {
      grid.release()
    }
  })

  it('wrap 行高只升不降：保留更高的导入/拖拽行高', () => {
    const { sheet, grid, table } = createGrid()
    try {
      sheet.setRowHeight(0, 120)
      sheet.setCellValue({ row: 0, col: 0 }, '短')
      sheet.setCellStyle(
        { start: { row: 0, col: 0 }, end: { row: 0, col: 0 } },
        { align: { wrap: true } }
      )
      expect(sheet.getRowHeight(0)).toBe(120)
      grid.flushPending()
      expect(table.getRowHeight(1)).toBe(120)
    } finally {
      grid.release()
    }
  })

  it('列默认 wrap 只估算有数据的格；宽表空列不参与扫描', () => {
    const container = createContainer()
    const sheet = new Sheet()
    sheet.ensureTableSize(8, 80)
    sheet.setColStyle(0, { align: { wrap: true } })
    sheet.setCellValue({ row: 3, col: 0 }, '一二三四五六七八九十'.repeat(6))
    const grid = new SheetGrid({ container, sheet, rows: 8, cols: 80 })
    try {
      expect(sheet.getRowHeight(3)).toBeGreaterThan(28)
      expect(grid.getTable().getRowHeight(4)).toBe(sheet.getRowHeight(3))
      expect(sheet.getRowHeight(0)).toBeUndefined()
    } finally {
      grid.release()
    }
  })

  it('纯样式格进入编辑后无改动退出：保留 fill/border（不删 s）', () => {
    const { sheet, grid, table } = createGrid()
    try {
      const addr = { row: 0, col: 0 }
      sheet.setCellStyle(
        { start: addr, end: addr },
        {
          fill: { color: '#FF0000' },
          border: {
            top: { style: 'thin', width: 1, color: '#0000FF' },
            right: { style: 'thin', width: 1, color: '#0000FF' },
            bottom: { style: 'thin', width: 1, color: '#0000FF' },
            left: { style: 'thin', width: 1, color: '#0000FF' }
          }
        }
      )
      const styleId = sheet.getCellData(addr)?.s
      expect(styleId).toBeDefined()

      // 程序化编辑退出（等价双击进编辑再点出）：提交空串，不得当成清除值
      table.startEditCell(1, 1)
      expect(editorInput(table)!.value).toBe('')
      table.completeEditCell()

      expect(sheet.getCellData(addr)?.s).toBe(styleId)
      expect(sheet.getCellStyle(addr)).toMatchObject({
        fill: { color: '#FF0000' },
        border: {
          top: expect.objectContaining({ color: '#0000FF' }),
          left: expect.objectContaining({ color: '#0000FF' })
        }
      })
      const rendered = columnStyleFn(table)({ row: 1, col: 1, table })
      expect(rendered.bgColor).toBe('#FF0000')
      expect((rendered.borderColor as string[])[0]).toBe('#0000FF')
    } finally {
      grid.release()
    }
  })

  it('有值+样式格编辑改值后：样式保留', () => {
    const { sheet, grid, table } = createGrid()
    try {
      const addr = { row: 0, col: 0 }
      sheet.setCellValue(addr, 'hello')
      sheet.setCellStyle({ start: addr, end: addr }, { fill: { color: '#00FF00' } })
      const styleId = sheet.getCellData(addr)?.s

      table.startEditCell(1, 1)
      editorInput(table)!.value = 'world'
      table.completeEditCell()

      expect(sheet.getCellData(addr)).toMatchObject({ v: 'world', s: styleId })
      expect(sheet.getCellStyle(addr)?.fill?.color).toBe('#00FF00')
      expect(columnStyleFn(table)({ row: 1, col: 1, table }).bgColor).toBe('#00FF00')
    } finally {
      grid.release()
    }
  })

  it('有值+样式格编辑清空后提交：整格删除（含样式）', () => {
    const { sheet, grid, table } = createGrid()
    try {
      const addr = { row: 0, col: 0 }
      sheet.setCellValue(addr, 'hello')
      sheet.setCellStyle({ start: addr, end: addr }, { fill: { color: '#00FF00' } })

      table.startEditCell(1, 1)
      editorInput(table)!.value = ''
      table.completeEditCell()

      expect(sheet.getCellData(addr)).toBeUndefined()
      expect(sheet.getCellStyle(addr)).toBeUndefined()
      expect(columnStyleFn(table)({ row: 1, col: 1, table }).bgColor).toBeUndefined()
    } finally {
      grid.release()
    }
  })
})

describe('多实例编辑路由（编辑器 hook 按发起编辑的 table 反查所属 grid）', () => {
  function createGridWithEditCallbacks(callbacks: {
    onEditStart?: (addr: { row: number; col: number }) => void
    onEditEnd?: (addr: { row: number; col: number }) => void
  }) {
    const sheet = new Sheet()
    const grid = new SheetGrid({
      container: createContainer(),
      sheet,
      rows: 20,
      cols: 6,
      ...callbacks
    })
    return { sheet, grid, table: grid.getTable() }
  }

  it('B 后创建时在 A 上编辑：初始文本读 A 的 sheet 数据（公式格显示原文）', () => {
    const a = createGrid()
    const b = createGrid()
    try {
      const addr = { row: 0, col: 0 }
      // 同坐标：A 公式格、B 纯值格
      a.sheet.setCellFormula(addr, '=1+1')
      b.sheet.setCellValue(addr, 'b-value')

      a.table.startEditCell(1, 1)
      // 路由正确 → 显示 A 的公式原文；错路由到 B → 显示 A 的缓存值 '2'（公式被覆盖风险）
      expect(editorInput(a.table)!.value).toBe('=1+1')
      a.table.completeEditCell()

      // 反向：A 纯值格、B 公式格，A 的编辑器不得显示 B 的公式原文
      a.sheet.setCellValue(addr, 'a-value')
      b.sheet.setCellFormula(addr, '=3+4')
      // 纯值格初始文本取 VTable record 值（模型直读只对公式格生效）→ 先 flush 批量同步
      a.grid.flushPending()
      a.table.startEditCell(1, 1)
      expect(editorInput(a.table)!.value).toBe('a-value')
      a.table.completeEditCell()
      // 提交后 A 为字面值、B 的公式不受影响（无跨实例污染）
      expect(a.sheet.getCellData(addr)).toMatchObject({ v: 'a-value' })
      expect(b.sheet.getCellData(addr)).toMatchObject({ f: '3+4' })
    } finally {
      a.grid.release()
      b.grid.release()
    }
  })

  it('onEditStart/onEditEnd 路由到发起编辑的实例（A），不触达 B', () => {
    const startsA: Array<{ row: number; col: number }> = []
    const endsA: Array<{ row: number; col: number }> = []
    const startsB: Array<{ row: number; col: number }> = []
    const endsB: Array<{ row: number; col: number }> = []
    const a = createGridWithEditCallbacks({
      onEditStart: (addr) => startsA.push(addr),
      onEditEnd: (addr) => endsA.push(addr)
    })
    const b = createGridWithEditCallbacks({
      onEditStart: (addr) => startsB.push(addr),
      onEditEnd: (addr) => endsB.push(addr)
    })
    try {
      a.table.startEditCell(1, 1)
      expect(startsA).toEqual([{ row: 0, col: 0 }])
      expect(startsB).toEqual([])

      a.table.completeEditCell()
      expect(endsA).toEqual([{ row: 0, col: 0 }])
      expect(endsB).toEqual([])
    } finally {
      a.grid.release()
      b.grid.release()
    }
  })

  it('B 释放后 A 的编辑 hook 仍正常工作（无 no-op 降级）', () => {
    const startsA: Array<{ row: number; col: number }> = []
    const endsA: Array<{ row: number; col: number }> = []
    const a = createGridWithEditCallbacks({
      onEditStart: (addr) => startsA.push(addr),
      onEditEnd: (addr) => endsA.push(addr)
    })
    const b = createGrid()
    // B 后创建随即释放：旧实现会把全局 editorTarget 清为 null
    b.grid.release()
    try {
      const addr = { row: 0, col: 0 }
      a.sheet.setCellFormula(addr, '=1+1')

      a.table.startEditCell(1, 1)
      // 公式格仍显示原文（hook 未降级为 no-op）
      expect(editorInput(a.table)!.value).toBe('=1+1')
      expect(startsA).toEqual([{ row: 0, col: 0 }])

      a.table.completeEditCell()
      expect(endsA).toEqual([{ row: 0, col: 0 }])
    } finally {
      a.grid.release()
    }
  })

  it('resolveDisplayValue 覆盖显示；meta-change 同步占位（不写 v）', () => {
    const container = createContainer()
    const sheet = new Sheet()
    const grid = new SheetGrid({
      container,
      sheet,
      rows: 10,
      cols: 6,
      resolveDisplayValue: (addr, base) => {
        const binding = sheet.getCellMeta<{ label: string }>(addr, 'report')
        if (binding) return binding.label
        return base
      }
    })
    try {
      const table = grid.getTable()
      const addr = { row: 1, col: 1 }

      sheet.setCellMeta(addr, 'report', { label: 'orders.amount' })
      grid.flushPending()

      expect(table.getCellValue(2, 2)).toBe('orders.amount')
      expect(sheet.getCellData(addr)?.v).toBeUndefined()

      sheet.setCellValue(addr, '静态表头')
      grid.flushPending()
      expect(table.getCellValue(2, 2)).toBe('orders.amount')

      sheet.clearCellMeta(addr, 'report')
      grid.flushPending()
      expect(table.getCellValue(2, 2)).toBe('静态表头')

      sheet.undo()
      grid.flushPending()
      expect(table.getCellValue(2, 2)).toBe('orders.amount')
    } finally {
      grid.release()
    }
  })

  it('resolveCellStyle 视口渲染叠加动态样式；不写 CellData.s', () => {
    const container = createContainer()
    const sheet = new Sheet()
    const hookCalls: Array<{
      addr: { row: number; col: number }
      base?: { fill?: { color: string } }
    }> = []
    const grid = new SheetGrid({
      container,
      sheet,
      rows: 10,
      cols: 6,
      resolveCellStyle: (addr, baseStyle) => {
        hookCalls.push({ addr, base: baseStyle })
        const value = sheet.getDisplayValue(addr)
        if (typeof value === 'number' && value > 100) {
          return { ...baseStyle, fill: { color: '#FFCCCC' } }
        }
        return baseStyle
      }
    })
    try {
      const table = grid.getTable()
      const hot = { row: 1, col: 1 }
      const cold = { row: 2, col: 1 }

      sheet.setCellValue(hot, 200)
      sheet.setCellValue(cold, 50)
      sheet.setCellStyle({ start: hot, end: hot }, { fill: { color: '#EEEEEE' } })
      grid.flushPending()

      const styleFn = columnStyleFn(table)
      hookCalls.length = 0
      expect(styleFn({ row: 2, col: 2, table }).bgColor).toBe('#FFCCCC')
      expect(styleFn({ row: 3, col: 2, table }).bgColor).toBeUndefined()

      expect(sheet.getCellStyle(hot)?.fill?.color).toBe('#EEEEEE')
      expect(sheet.getCellData(hot)?.s).toBeDefined()

      const hotCall = hookCalls.find((c) => c.addr.row === hot.row && c.addr.col === hot.col)
      expect(hotCall?.base).toMatchObject({ fill: { color: '#EEEEEE' } })
    } finally {
      grid.release()
    }
  })

  it('resolveCellStyle 返回 undefined 时回落 baseStyle', () => {
    const container = createContainer()
    const sheet = new Sheet()
    const grid = new SheetGrid({
      container,
      sheet,
      rows: 10,
      cols: 6,
      resolveCellStyle: () => undefined
    })
    try {
      const table = grid.getTable()
      const addr = { row: 0, col: 0 }
      sheet.setCellStyle({ start: addr, end: addr }, { fill: { color: '#AABBCC' } })
      grid.flushPending()

      expect(columnStyleFn(table)({ row: 1, col: 1, table }).bgColor).toBe('#AABBCC')
    } finally {
      grid.release()
    }
  })
})
