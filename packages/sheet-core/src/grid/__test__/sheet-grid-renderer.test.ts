import type { CustomRenderFunctionArg } from '@visactor/vtable/es/ts-types/customElement'
import type { ICustomLayoutObj } from '@visactor/vtable/es/ts-types/customLayout'
import { describe, expect, it } from 'vitest'

import { Sheet } from '../../core/sheet'
import { CustomLayout, SheetGrid } from '../sheet-grid'

function createContainer(): HTMLElement {
  const el = document.createElement('div')
  el.style.width = '800px'
  el.style.height = '600px'
  document.body.appendChild(el)
  return el
}

/** 从列定义取出 customLayout 分发器（同 columnStyleFn 的既有测试手法） */
function columnCustomLayout(table: unknown) {
  const column = (
    table as { getBodyColumnDefine: (col: number, row: number) => unknown }
  ).getBodyColumnDefine(1, 1) as { customLayout?: (args: CustomRenderFunctionArg) => unknown }
  return column.customLayout
}

function layoutArgs(
  table: unknown,
  col: number,
  row: number,
  dataValue: unknown = undefined
): CustomRenderFunctionArg {
  return {
    col,
    row,
    table,
    value: dataValue,
    dataValue,
    rect: { left: 0, top: 0, right: 80, bottom: 28, width: 80, height: 28 },
    originCol: col,
    originRow: row
  }
}

describe('SheetGrid resolveCellRenderer（ADR-0004 渲染扩展口）', () => {
  it('未提供 hook 时不安装 customLayout 分发器（默认渲染零差异）', () => {
    const container = createContainer()
    const sheet = new Sheet()
    const grid = new SheetGrid({ container, sheet, rows: 10, cols: 6 })
    try {
      const table = grid.getTable()
      expect(columnCustomLayout(table)).toBeUndefined()
      expect(table._hasCustomRenderOrLayout()).toBe(false)
    } finally {
      grid.release()
    }
  })

  it('按格回调：地址正确、base 为显示值、返回值透传；列级分发器已安装', () => {
    const container = createContainer()
    const sheet = new Sheet()
    const calls: Array<{ addr: { row: number; col: number }; base: unknown }> = []
    const layoutObj: ICustomLayoutObj = {
      rootContainer: new CustomLayout.Container({ width: 80, height: 28, fill: '#E8F1FF' }),
      renderDefault: false
    }
    const grid = new SheetGrid({
      container,
      sheet,
      rows: 10,
      cols: 6,
      // 显示值覆盖与渲染 hook 同用：base 应为覆盖后的显示值
      resolveDisplayValue: (addr, base) => (base == null ? base : String(base).toUpperCase()),
      resolveCellRenderer: (addr, base) => {
        calls.push({ addr, base })
        return layoutObj
      }
    })
    try {
      const table = grid.getTable()
      sheet.setCellValue({ row: 1, col: 1 }, 'x')
      grid.flushPending()

      expect(table._hasCustomRenderOrLayout()).toBe(true)

      // 端到端：canvas mock 下 VTable 真实布局已按格回调分发器（模型地址正确、
      // base 为覆盖后的显示值），B2（表格坐标 2,2）带值 'X'
      const realCall = calls.find((c) => c.base === 'X')
      expect(realCall).toEqual({ addr: { row: 1, col: 1 }, base: 'X' })

      // 手动模拟一次布局调用（表格坐标 (2,2) → 模型 B2）
      const dispatch = columnCustomLayout(table)
      expect(dispatch).toBeTypeOf('function')
      calls.length = 0
      const result = dispatch!(layoutArgs(table, 2, 2, 'X'))
      expect(result).toBe(layoutObj)
      expect(calls).toHaveLength(1)
      expect(calls[0]).toEqual({ addr: { row: 1, col: 1 }, base: 'X' })
    } finally {
      grid.release()
    }
  })

  it('行号列 / 列头回落默认渲染：hook 不回调', () => {
    const container = createContainer()
    const sheet = new Sheet()
    const calls: unknown[] = []
    const grid = new SheetGrid({
      container,
      sheet,
      rows: 10,
      cols: 6,
      resolveCellRenderer: (addr, base) => {
        calls.push({ addr, base })
        return { rootContainer: new CustomLayout.Container({}), renderDefault: false }
      }
    })
    try {
      const table = grid.getTable()
      const dispatch = columnCustomLayout(table)!

      // 真实布局回调均为 body 格；手动验证行号列/列头回落
      calls.length = 0
      expect(dispatch(layoutArgs(table, 0, 2))).toBeUndefined()
      expect(dispatch(layoutArgs(table, 2, 0))).toBeUndefined()
      expect(calls).toHaveLength(0)
    } finally {
      grid.release()
    }
  })

  it('合并格按锚点回调（VTable 传 range.start）', () => {
    const container = createContainer()
    const sheet = new Sheet()
    const calls: Array<{ row: number; col: number }> = []
    const grid = new SheetGrid({
      container,
      sheet,
      rows: 10,
      cols: 6,
      resolveCellRenderer: (addr) => {
        calls.push(addr)
        return undefined
      }
    })
    try {
      const table = grid.getTable()
      sheet.mergeCells({ start: { row: 2, col: 1 }, end: { row: 2, col: 2 } })
      grid.flushPending()
      const dispatch = columnCustomLayout(table)!

      // 合并格布局调用携带锚点表格坐标（col 2 = 模型列 1）
      calls.length = 0
      dispatch(layoutArgs(table, 2, 3, 'v'))
      expect(calls).toHaveLength(1)
      expect(calls[0]).toEqual({ row: 2, col: 1 })
    } finally {
      grid.release()
    }
  })

  it('返回 undefined 回落默认渲染；模型与快照无 renderer 残留', () => {
    const container = createContainer()
    const sheet = new Sheet()
    const grid = new SheetGrid({
      container,
      sheet,
      rows: 10,
      cols: 6,
      resolveCellRenderer: () => undefined
    })
    try {
      const table = grid.getTable()
      const addr = { row: 0, col: 0 }
      sheet.setCellValue(addr, 'value')
      grid.flushPending()

      // 分发器返回 undefined → VTable 走默认绘制
      const dispatch = columnCustomLayout(table)!
      expect(dispatch(layoutArgs(table, 1, 1, 'value'))).toBeUndefined()
      // 默认渲染仍显示值（record 照常构建）
      expect(table.getCellValue(1, 1)).toBe('value')

      // 模型无 renderer 残留：CellData 仅含已知字段（v/t/f/s），快照条目
      // 无多余字段、无 meta
      const cellData = sheet.getCellData(addr)
      expect(Object.keys(cellData!).sort()).toEqual(['s', 't', 'v'])
      const snapshot = sheet.snapshot()
      expect(snapshot.cells).toEqual([{ row: 0, col: 0, v: 'value', t: 's' }])
      expect(snapshot.meta).toBeUndefined()
    } finally {
      grid.release()
    }
  })
})
