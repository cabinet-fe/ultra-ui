import { createRange } from '@veltra/sheet-core/core/address.js'
import { Sheet } from '@veltra/sheet-core/core/sheet.js'
import { describe, expect, it, vi } from 'vite-plus/test'

import { createSheetContext, MIN_ROW_COL_SIZE } from '../context'
import type { SheetTool } from '../registry'

describe('SheetContext', () => {
  it('读写直达目标 sheet；写入经命令系统可 undo/redo', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)

    ctx.setCellValue({ row: 0, col: 0 }, 'hello')
    expect(sheet.getCellData({ row: 0, col: 0 })).toEqual({ v: 'hello', t: 's' })
    expect(ctx.getDisplayValue({ row: 0, col: 0 })).toBe('hello')
    expect(ctx.canUndo).toBe(true)

    expect(ctx.undo()).toBe(true)
    expect(sheet.getCellData({ row: 0, col: 0 })).toBeUndefined()
    expect(ctx.canRedo).toBe(true)

    expect(ctx.redo()).toBe(true)
    expect(sheet.getCellData({ row: 0, col: 0 })).toEqual({ v: 'hello', t: 's' })
  })

  it('公式、合并、取消合并均经门面且可 undo', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)

    ctx.setCellValue({ row: 0, col: 0 }, 2)
    ctx.setCellFormula({ row: 0, col: 1 }, '=A1*3')
    expect(ctx.getDisplayValue({ row: 0, col: 1 })).toBe(6)

    const range = createRange({ row: 1, col: 0 }, { row: 2, col: 1 })
    ctx.mergeCells(range)
    expect(ctx.getCellInfo({ row: 2, col: 1 }).kind).toBe('merged-covered')

    ctx.unmergeCells(range)
    expect(ctx.getCellInfo({ row: 2, col: 1 }).kind).toBe('normal')

    ctx.undo() // undo unmerge → 恢复合并
    expect(ctx.getCellInfo({ row: 2, col: 1 }).kind).toBe('merged-covered')
    ctx.undo() // undo merge
    ctx.undo() // undo 公式
    expect(sheet.getCellData({ row: 0, col: 1 })).toBeUndefined()
  })

  it('选区读写与 selection-change / history-change 订阅', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)

    const onSelection = vi.fn()
    const onHistory = vi.fn()
    const offSelection = ctx.onSelectionChange(onSelection)
    ctx.onHistoryChange(onHistory)

    ctx.selectRange(createRange({ row: 0, col: 0 }, { row: 1, col: 2 }))
    expect(onSelection).toHaveBeenCalledTimes(1)
    expect(ctx.getSelection().activeCell).toEqual({ row: 0, col: 0 })
    expect(ctx.getSelection().ranges[0]).toEqual({
      start: { row: 0, col: 0 },
      end: { row: 1, col: 2 }
    })

    ctx.setCellValue({ row: 0, col: 0 }, 1)
    expect(onHistory).toHaveBeenCalledWith({ canUndo: true, canRedo: false })

    offSelection()
    ctx.selectCell({ row: 3, col: 3 })
    expect(onSelection).toHaveBeenCalledTimes(1)
  })

  it('批量写入 + 事务 = 一个 undo 单元', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)

    ctx.setCells([
      { addr: { row: 0, col: 0 }, data: { v: 1, t: 'n' } },
      { addr: { row: 0, col: 1 }, data: { v: 2, t: 'n' } }
    ])
    ctx.undo()
    expect(sheet.getCellData({ row: 0, col: 0 })).toBeUndefined()
    expect(sheet.getCellData({ row: 0, col: 1 })).toBeUndefined()

    ctx.beginTransaction()
    ctx.setCellValue({ row: 1, col: 0 }, 'a')
    ctx.setCellValue({ row: 1, col: 1 }, 'b')
    ctx.commit()
    ctx.undo()
    expect(sheet.getCellData({ row: 1, col: 0 })).toBeUndefined()
    expect(sheet.getCellData({ row: 1, col: 1 })).toBeUndefined()
  })

  it('样式门面：setCellStyle / clearCellStyle / getCellStyle，经命令可 undo', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)

    const range = createRange({ row: 0, col: 0 }, { row: 1, col: 1 })
    ctx.setCellStyle(range, { fill: { color: '#FF0000' } })
    expect(ctx.getCellStyle({ row: 0, col: 0 })).toEqual({ fill: { color: '#FF0000' } })
    expect(sheet.stylePool.size).toBe(1)

    // 部分合并：只设边框保留填充
    ctx.setCellStyle(range, { border: { top: { style: 'thin', width: 1, color: '#000000' } } })
    expect(ctx.getCellStyle({ row: 1, col: 1 })).toEqual({
      fill: { color: '#FF0000' },
      border: { top: { style: 'thin', width: 1, color: '#000000' } }
    })

    ctx.clearCellStyle(range)
    expect(ctx.getCellStyle({ row: 0, col: 0 })).toBeUndefined()

    // 一次 undo 回退到带边框填充状态
    expect(ctx.undo()).toBe(true)
    expect(ctx.getCellStyle({ row: 0, col: 0 })?.border).toBeDefined()
    expect(ctx.getCellStyle({ row: 0, col: 0 })?.fill?.color).toBe('#FF0000')
  })

  it('动态解析器：tab 切换后同一上下文指向新的活动 sheet', () => {
    const sheet1 = new Sheet('Sheet1')
    const sheet2 = new Sheet('Sheet2')
    let active = sheet1
    const ctx = createSheetContext(() => active)

    expect(ctx.sheetName).toBe('Sheet1')
    ctx.setCellValue({ row: 0, col: 0 }, 'one')

    active = sheet2 // 模拟 tab 切换
    expect(ctx.sheetName).toBe('Sheet2')
    ctx.setCellValue({ row: 0, col: 0 }, 'two')

    expect(sheet1.getCellData({ row: 0, col: 0 })).toEqual({ v: 'one', t: 's' })
    expect(sheet2.getCellData({ row: 0, col: 0 })).toEqual({ v: 'two', t: 's' })

    // undo 作用于当前活动 sheet
    expect(ctx.undo()).toBe(true)
    expect(sheet2.getCellData({ row: 0, col: 0 })).toBeUndefined()
    expect(sheet1.getCellData({ row: 0, col: 0 })).toEqual({ v: 'one', t: 's' })
  })

  it('executeCommand 执行自定义命令', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    // 内置命令走默认注册表
    ctx.executeCommand('sheet.command.set-cell-value', {
      items: [{ addr: { row: 0, col: 0 }, data: { v: 'x', t: 's' } }]
    })
    expect(sheet.getCellData({ row: 0, col: 0 })).toEqual({ v: 'x', t: 's' })
    expect(ctx.canUndo).toBe(true)
  })

  it('自定义工具 onClick 内执行命令 → 可被 undo（扩展不绕过命令系统）', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.setCellValue({ row: 0, col: 0 }, 'keep')
    sheet.history.clear()

    // 第三方工具：清空选区（批量写，一个 undo 单元）
    const clearTool: SheetTool = {
      id: 'clear-selection',
      title: '清空选区',
      onClick: (toolCtx) => {
        const range = toolCtx.getSelection().ranges[0]
        if (!range) return
        const items = []
        for (let row = range.start.row; row <= range.end.row; row++) {
          for (let col = range.start.col; col <= range.end.col; col++) {
            items.push({ addr: { row, col }, data: undefined })
          }
        }
        toolCtx.setCells(items)
      }
    }

    ctx.selectRange(createRange({ row: 0, col: 0 }, { row: 0, col: 0 }))
    clearTool.onClick(ctx)
    expect(sheet.getCellData({ row: 0, col: 0 })).toBeUndefined()

    expect(ctx.undo()).toBe(true)
    expect(sheet.getCellData({ row: 0, col: 0 })).toEqual({ v: 'keep', t: 's' })
  })

  it('行列尺寸门面：读取 + 按选区覆盖行/列批量应用，不进 undo', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)

    // 未设置自定义尺寸时读取为 undefined（视图层用默认行高/列宽）
    expect(ctx.getRowHeight(1)).toBeUndefined()
    expect(ctx.getColWidth(2)).toBeUndefined()

    ctx.selectRange(createRange({ row: 1, col: 2 }, { row: 3, col: 4 }))
    ctx.setRowHeightBySelection(40)
    ctx.setColWidthBySelection(120)
    // 选区覆盖行 1..3 全部生效，行 0 不受影响
    expect(ctx.getRowHeight(1)).toBe(40)
    expect(ctx.getRowHeight(2)).toBe(40)
    expect(ctx.getRowHeight(3)).toBe(40)
    expect(ctx.getRowHeight(0)).toBeUndefined()
    // 选区覆盖列 2..4 全部生效，列 5 不受影响
    expect(ctx.getColWidth(2)).toBe(120)
    expect(ctx.getColWidth(3)).toBe(120)
    expect(ctx.getColWidth(4)).toBe(120)
    expect(ctx.getColWidth(5)).toBeUndefined()

    // 同 rowHeights/冻结先例：尺寸写入不进 undo 历史
    expect(ctx.canUndo).toBe(false)
  })

  it('行列尺寸门面：下限钳制到引擎最小值 20；空选区无操作', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)

    ctx.selectRange(createRange({ row: 2, col: 3 }, { row: 2, col: 4 }))
    ctx.setRowHeightBySelection(10)
    ctx.setColWidthBySelection(5)
    expect(ctx.getRowHeight(2)).toBe(MIN_ROW_COL_SIZE)
    expect(ctx.getColWidth(3)).toBe(MIN_ROW_COL_SIZE)
    expect(ctx.getColWidth(4)).toBe(MIN_ROW_COL_SIZE)

    // 空选区：无写入目标，不产生任何尺寸
    sheet.selection.clear()
    ctx.setRowHeightBySelection(60)
    ctx.setColWidthBySelection(200)
    expect(ctx.getRowHeight(0)).toBeUndefined()
    expect(ctx.getColWidth(0)).toBeUndefined()
  })

  it('行列尺寸门面：写入后经 syncAxisSizes 同步钩子（携带选区覆盖行/列；空选区不触发）', () => {
    const sheet = new Sheet()
    const syncAxisSizes = vi.fn()
    const ctx = createSheetContext(sheet, undefined, { syncAxisSizes })

    ctx.selectRange(createRange({ row: 1, col: 2 }, { row: 2, col: 3 }))
    ctx.setRowHeightBySelection(40)
    expect(syncAxisSizes).toHaveBeenCalledWith('row', [1, 2])
    ctx.setColWidthBySelection(120)
    expect(syncAxisSizes).toHaveBeenCalledWith('col', [2, 3])

    // 空选区：模型无写入，同步钩子不触发
    syncAxisSizes.mockClear()
    sheet.selection.clear()
    ctx.setRowHeightBySelection(60)
    ctx.setColWidthBySelection(60)
    expect(syncAxisSizes).not.toHaveBeenCalled()
  })

  it('图片门面：insertImage / removeImage / updateImage / getImages / onImageChange，经命令可 undo', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const onImage = vi.fn()
    const off = ctx.onImageChange(onImage)

    const data = new Uint8Array([1, 2, 3])
    const id = ctx.insertImage({ data, type: 'png', anchor: { from: { row: 1, col: 2 } } })
    expect(id).toBeTruthy()
    expect(ctx.getImages()).toHaveLength(1)
    expect(ctx.getImages()[0]?.anchor.from).toEqual({ row: 1, col: 2 })
    expect(onImage).toHaveBeenCalledWith({ id })

    ctx.updateImage(id, { anchor: { from: { row: 3, col: 4 } } })
    expect(ctx.getImages()[0]?.anchor.from).toEqual({ row: 3, col: 4 })
    expect(onImage).toHaveBeenCalledWith({ id })

    ctx.removeImage(id)
    expect(ctx.getImages()).toHaveLength(0)
    expect(onImage).toHaveBeenCalledWith({ id })

    expect(ctx.undo()).toBe(true)
    expect(ctx.getImages()).toHaveLength(1)
    expect(ctx.getImages()[0]?.anchor.from).toEqual({ row: 3, col: 4 })

    expect(ctx.undo()).toBe(true)
    expect(ctx.getImages()[0]?.anchor.from).toEqual({ row: 1, col: 2 })

    off()
    onImage.mockClear()
    ctx.removeImage(id)
    expect(ctx.getImages()).toHaveLength(0)
    expect(onImage).not.toHaveBeenCalled()
  })
})
