import { describe, expect, it, vi } from 'vitest'

import { createRange } from '../../core/address'
import { Sheet } from '../../core/sheet'
import { createSheetContext } from '../context'
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
})
