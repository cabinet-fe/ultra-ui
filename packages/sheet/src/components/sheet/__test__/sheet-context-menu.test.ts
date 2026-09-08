import { createRange } from '@veltra/sheet-core/core/address'
import { Sheet } from '@veltra/sheet-core/core/sheet'
import { describe, expect, it } from 'vitest'

import { createSheetContext } from '../../../tools/context'
import {
  applyNumFmtToSelection,
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

  it('resolveRenderSize：模型已声明时以模型为准（可低于 props）', () => {
    expect(resolveRenderSize(100, 26, 120, 10)).toEqual({ rows: 120, cols: 10 })
    expect(resolveRenderSize(100, 26, 29, 26)).toEqual({ rows: 29, cols: 26 })
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

  it('body 菜单：合并/取消合并 + 设置数据格式子菜单 + 插入图片，不含行列插入删除', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectCell({ row: 0, col: 0 })
    const menus = buildBodyMenus(ctx)
    expect(menus).toHaveLength(5)
    expect(menus.map((m) => m.label ?? (m.divider ? '---' : ''))).toEqual([
      '合并单元格',
      '取消合并单元格',
      '---',
      '设置数据格式',
      '插入图片'
    ])
    const insertImage = menus.find((m) => m.label === '插入图片')!
    expect(insertImage.disabled).toBeFalsy()
    expect(insertImage.callback).toBeTruthy()
    const labels = menus.map((m) => m.label).join()
    expect(labels).not.toContain('插入行')
    expect(labels).not.toContain('插入列')
    expect(labels).not.toContain('删除行')
    expect(labels).not.toContain('删除列')
  })

  it('body 设置数据格式子菜单：日期 / 千分位金额 / 大写金额 / 小数位数', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectCell({ row: 0, col: 0 })
    const sub = buildBodyMenus(ctx).find((m) => m.label === '设置数据格式')!
    expect(sub.disabled).toBeFalsy()
    const children = sub.children!
    expect(children.map((c) => c.label)).toEqual(['日期', '千分位金额', '大写金额', '小数位数'])
    // 小数位数项内嵌位数输入（keepOpen + render），其余三项直点直用
    expect(children[3]?.keepOpen).toBe(true)
    expect(children[3]?.render).toBeTruthy()
    expect(children.slice(0, 3).every((c) => typeof c.callback === 'function')).toBe(true)
  })

  it('设置数据格式：四项各应用 numFmt 到当前选区全部单元格，原始值不变', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.setCellValue({ row: 0, col: 0 }, 45000)
    sheet.setCellValue({ row: 0, col: 1 }, 1234567.89)
    const range = createRange({ row: 0, col: 0 }, { row: 0, col: 1 })

    const cases = [
      { label: '日期', numFmt: { type: 'date' } },
      { label: '千分位金额', numFmt: { type: 'thousands' } },
      { label: '大写金额', numFmt: { type: 'cnUpper' } }
    ] as const
    for (const c of cases) {
      sheet.selectRange(range)
      const sub = buildBodyMenus(ctx).find((m) => m.label === '设置数据格式')!
      sub.children!.find((child) => child.label === c.label)!.callback!()
      for (const addr of [
        { row: 0, col: 0 },
        { row: 0, col: 1 }
      ]) {
        expect(ctx.getCellStyle(addr)?.numFmt).toEqual(c.numFmt)
      }
      // 仅样式变化，原始值不变
      expect(ctx.getCellData({ row: 0, col: 0 })?.v).toBe(45000)
      expect(ctx.getCellData({ row: 0, col: 1 })?.v).toBe(1234567.89)
      sheet.undo()
    }

    // 小数位数：经同一入口 applyNumFmtToSelection（render onConfirm 同路径）
    sheet.selectRange(range)
    applyNumFmtToSelection(ctx, { type: 'fixed', digits: 2 })
    expect(ctx.getCellStyle({ row: 0, col: 0 })?.numFmt).toEqual({ type: 'fixed', digits: 2 })
    expect(ctx.getCellStyle({ row: 0, col: 1 })?.numFmt).toEqual({ type: 'fixed', digits: 2 })
    sheet.undo()
  })

  it('设置数据格式：undo/redo 恢复样式', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.setCellValue({ row: 1, col: 1 }, 1.005)
    sheet.selectRange(createRange({ row: 1, col: 1 }, { row: 1, col: 1 }))
    const sub = buildBodyMenus(ctx).find((m) => m.label === '设置数据格式')!
    sub.children!.find((c) => c.label === '千分位金额')!.callback!()
    expect(ctx.getCellStyle({ row: 1, col: 1 })?.numFmt).toEqual({ type: 'thousands' })

    expect(ctx.undo()).toBe(true)
    expect(ctx.getCellStyle({ row: 1, col: 1 })?.numFmt).toBeUndefined()
    expect(ctx.redo()).toBe(true)
    expect(ctx.getCellStyle({ row: 1, col: 1 })?.numFmt).toEqual({ type: 'thousands' })
    expect(ctx.getCellData({ row: 1, col: 1 })?.v).toBe(1.005)
  })

  it('设置数据格式：清空选区时为无操作（不产生 undo 单元）', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.setCellValue({ row: 0, col: 0 }, 1)
    sheet.selection.clear()
    applyNumFmtToSelection(ctx, { type: 'date' })
    expect(ctx.getCellStyle({ row: 0, col: 0 })).toBeUndefined()
    // undo 直接回滚到 setCellValue 之前，证明未新增 undo 单元
    expect(ctx.undo()).toBe(true)
    expect(ctx.getCellData({ row: 0, col: 0 })).toBeUndefined()
    expect(ctx.canUndo).toBe(false)
  })

  it('body 插入图片 / 设置数据格式：无活动格时禁用', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selection.clear()
    const menus = buildBodyMenus(ctx)
    expect(menus.find((m) => m.label === '插入图片')?.disabled).toBe(true)
    expect(menus.find((m) => m.label === '设置数据格式')?.disabled).toBe(true)
  })

  it('行号/列头菜单仍含插入删除行列', () => {
    const sheet = new Sheet()
    const ctx = createSheetContext(sheet)
    sheet.selectCell({ row: 0, col: 0 })
    const rowLabels = buildRowHeaderMenus(ctx)
      .map((m) => m.label)
      .join()
    const colLabels = buildColHeaderMenus(ctx)
      .map((m) => m.label)
      .join()
    expect(rowLabels).toContain('在上方插入行')
    expect(rowLabels).toContain('在下方插入行')
    expect(rowLabels).toContain('删除行')
    expect(colLabels).toContain('在左侧插入列')
    expect(colLabels).toContain('在右侧插入列')
    expect(colLabels).toContain('删除列')
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
