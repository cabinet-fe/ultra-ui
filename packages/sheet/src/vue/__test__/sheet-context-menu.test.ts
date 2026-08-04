import { describe, expect, it } from 'vitest'

import { createRange } from '../../core/address'
import { Sheet } from '../../core/sheet'
import { createSheetContext } from '../../tools/context'
import {
  buildBodyMenus,
  buildColHeaderMenus,
  buildRowHeaderMenus,
  defaultInsertCount,
  ensureContextMenuSelection,
  isColInSelection,
  isRowInSelection,
  resolveRenderSize,
  wholeColRange,
  wholeRowRange
} from '../sheet-context-menu'

describe('sheet-context-menu helpers', () => {
  it('defaultInsertCount = 选区覆盖行/列数（钳制 1..1000）', () => {
    expect(defaultInsertCount(null, 'row')).toBe(1)
    expect(defaultInsertCount(createRange({ row: 2, col: 0 }, { row: 4, col: 2 }), 'row')).toBe(3)
    expect(defaultInsertCount(createRange({ row: 0, col: 1 }, { row: 0, col: 5 }), 'col')).toBe(5)
    expect(defaultInsertCount(createRange({ row: 0, col: 0 }, { row: 2000, col: 0 }), 'row')).toBe(
      1000
    )
  })

  it('整行/整列选区与选区覆盖判定', () => {
    expect(wholeRowRange(2, 6)).toEqual({ start: { row: 2, col: 0 }, end: { row: 2, col: 5 } })
    expect(wholeColRange(3, 10)).toEqual({ start: { row: 0, col: 3 }, end: { row: 9, col: 3 } })
    const ranges = [createRange({ row: 1, col: 0 }, { row: 3, col: 5 })]
    expect(isRowInSelection(ranges, 2)).toBe(true)
    expect(isRowInSelection(ranges, 5)).toBe(false)
    expect(isColInSelection(ranges, 4)).toBe(true)
    expect(isColInSelection(ranges, 6)).toBe(false)
  })

  it('resolveRenderSize = max(props, sheet)', () => {
    expect(resolveRenderSize(100, 26, 120, 10)).toEqual({ rows: 120, cols: 26 })
    expect(resolveRenderSize(undefined, undefined, 0, 0)).toEqual({ rows: 100, cols: 26 })
  })
})

describe('ensureContextMenuSelection', () => {
  it('body 落点在选区外 → 选中该格', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectRange(createRange({ row: 0, col: 0 }, { row: 1, col: 1 }))
    ensureContextMenuSelection(
      ctx,
      { kind: 'body', addr: { row: 5, col: 2 } },
      { rows: 100, cols: 26 }
    )
    expect(ctx.getSelection().activeCell).toEqual({ row: 5, col: 2 })
  })

  it('行号落点在选区外 → 选中整行', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectCell({ row: 0, col: 0 })
    ensureContextMenuSelection(
      ctx,
      { kind: 'row-header', addr: null, row: 4 },
      { rows: 100, cols: 6 }
    )
    expect(ctx.getSelection().ranges[0]).toEqual({
      start: { row: 4, col: 0 },
      end: { row: 4, col: 5 }
    })
  })

  it('行号落点在选区内 → 保留选区', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    const range = createRange({ row: 2, col: 0 }, { row: 4, col: 5 })
    sheet.selectRange(range)
    ensureContextMenuSelection(
      ctx,
      { kind: 'row-header', addr: null, row: 3 },
      { rows: 100, cols: 6 }
    )
    expect(ctx.getSelection().ranges[0]).toEqual(range)
  })

  it('列头落点在选区外 → 选中整列', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectCell({ row: 0, col: 0 })
    ensureContextMenuSelection(
      ctx,
      { kind: 'col-header', addr: null, col: 2 },
      { rows: 10, cols: 26 }
    )
    expect(ctx.getSelection().ranges[0]).toEqual({
      start: { row: 0, col: 2 },
      end: { row: 9, col: 2 }
    })
  })
})

describe('build*Menus', () => {
  it('行号菜单：插入×2 / 删除 / divider / 冻结项；无合并/插入列', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectRange(createRange({ row: 1, col: 0 }, { row: 3, col: 5 }))
    const menus = buildRowHeaderMenus(ctx)
    const labels = menus.map((m) => m.label ?? (m.divider ? '---' : ''))
    expect(labels).toEqual([
      '在上方插入行',
      '在下方插入行',
      '删除行',
      '---',
      '冻结到当前行',
      '取消冻结'
    ])
    expect(menus.filter((m) => m.keepOpen)).toHaveLength(2)
    expect(menus.some((m) => m.divider)).toBe(true)
    expect(menus.at(-1)?.disabled).toBe(true)
    expect(labels.join()).not.toContain('合并')
    expect(labels.join()).not.toContain('插入列')
  })

  it('冻结到当前行 active 标记 + 取消冻结可用', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectRange(createRange({ row: 0, col: 0 }, { row: 2, col: 5 }))
    sheet.setFrozen(3, 0) // endRow(2)+1
    const menus = buildRowHeaderMenus(ctx)
    expect(menus.find((m) => m.label?.includes('冻结到当前行'))?.label).toBe('✓ 冻结到当前行')
    expect(menus.find((m) => m.label === '取消冻结')?.disabled).toBe(false)
  })

  it('列头菜单对称', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectRange(createRange({ row: 0, col: 1 }, { row: 9, col: 3 }))
    const labels = buildColHeaderMenus(ctx).map((m) => m.label ?? (m.divider ? '---' : ''))
    expect(labels).toEqual([
      '在左侧插入列',
      '在右侧插入列',
      '删除列',
      '---',
      '冻结到当前列',
      '取消冻结'
    ])
  })

  it('body 菜单六项且插入项 keepOpen + render', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectCell({ row: 0, col: 0 })
    const menus = buildBodyMenus(ctx)
    expect(menus).toHaveLength(6)
    expect(menus.map((m) => m.label)).toEqual([
      '合并单元格',
      '取消合并单元格',
      '插入行',
      '插入列',
      '删除行',
      '删除列'
    ])
    const insertRows = menus.find((m) => m.label === '插入行')!
    const insertCols = menus.find((m) => m.label === '插入列')!
    expect(insertRows.keepOpen).toBe(true)
    expect(insertCols.keepOpen).toBe(true)
    expect(insertRows.render).toBeTruthy()
    expect(insertCols.render).toBeTruthy()
  })

  it('body 删除行/列：相对选区直调 ctx，不依赖已移除的 structure 工具', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.setCellValue({ row: 1, col: 0 }, 'r1')
    sheet.setCellValue({ row: 2, col: 0 }, 'r2')
    sheet.setCellValue({ row: 3, col: 0 }, 'r3')
    sheet.setCellValue({ row: 0, col: 1 }, 'c1')
    sheet.setCellValue({ row: 0, col: 2 }, 'c2')
    sheet.setCellValue({ row: 0, col: 3 }, 'c3')
    sheet.selectRange(createRange({ row: 1, col: 1 }, { row: 2, col: 2 }))
    const menus = buildBodyMenus(ctx)
    const deleteRows = menus.find((m) => m.label === '删除行')!
    const deleteCols = menus.find((m) => m.label === '删除列')!
    expect(deleteRows.disabled).toBeFalsy()
    expect(deleteCols.disabled).toBeFalsy()

    deleteRows.callback?.()
    // 删 row1-2 后 r3 上移到 row1
    expect(sheet.getDisplayValue({ row: 1, col: 0 })).toBe('r3')
    expect(sheet.getDisplayValue({ row: 3, col: 0 })).toBeUndefined()

    sheet.undo()
    deleteCols.callback?.()
    // 删 col1-2 后 c3 左移到 col1；c1/c2 移除
    expect(sheet.getDisplayValue({ row: 0, col: 1 })).toBe('c3')
    expect(sheet.getDisplayValue({ row: 0, col: 2 })).toBeUndefined()
    expect(sheet.getDisplayValue({ row: 0, col: 3 })).toBeUndefined()
  })

  it('行号菜单：上方插入落在选区首行、下方插入落在末行+1', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.setCellValue({ row: 5, col: 0 }, 'keep')
    sheet.selectRange(createRange({ row: 1, col: 0 }, { row: 2, col: 5 }))
    const menus = buildRowHeaderMenus(ctx)
    // 模拟 confirm：直接调 insert（与 render onConfirm 同路径）
    ctx.insertRows(1, 2) // 上方
    expect(sheet.getDisplayValue({ row: 7, col: 0 })).toBe('keep')
    sheet.undo()
    ctx.insertRows(3, 2) // 下方 endRow+1
    expect(sheet.getDisplayValue({ row: 7, col: 0 })).toBe('keep')
    expect(menus[0]?.keepOpen).toBe(true)
  })
})
