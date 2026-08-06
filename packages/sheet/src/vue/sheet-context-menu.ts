import type { ContextmenuItem } from '@veltra/desktop'
import { createRange, type CellAddress, type CellRange } from '@veltra/sheet-core/core/address'
import { defineComponent, h } from 'vue'

import type { SheetContext } from '../tools/context'
import { defaultToolRegistry } from '../tools/registry'
import InsertCountMenuItem from './insert-count-menu-item.vue'
import { pickAndInsertImage } from './insert-image'

/** 插入数量钳制范围（对齐 univer） */
export const INSERT_COUNT_MIN = 1
export const INSERT_COUNT_MAX = 1000

/** 选区覆盖行/列数 → 插入默认 N（min 1 / max 1000） */
export function defaultInsertCount(range: CellRange | null, axis: 'row' | 'col'): number {
  if (!range) return INSERT_COUNT_MIN
  const n =
    axis === 'row' ? range.end.row - range.start.row + 1 : range.end.col - range.start.col + 1
  return Math.min(INSERT_COUNT_MAX, Math.max(INSERT_COUNT_MIN, n))
}

/** 点击行是否落在任一选区内（按行号覆盖） */
export function isRowInSelection(ranges: CellRange[], row: number): boolean {
  return ranges.some((r) => r.start.row <= row && row <= r.end.row)
}

/** 点击列是否落在任一选区内（按列号覆盖） */
export function isColInSelection(ranges: CellRange[], col: number): boolean {
  return ranges.some((r) => r.start.col <= col && col <= r.end.col)
}

/** 整行选区（列跨渲染宽度） */
export function wholeRowRange(row: number, colCount: number): CellRange {
  return createRange({ row, col: 0 }, { row, col: Math.max(colCount - 1, 0) })
}

/** 整列选区（行跨渲染高度） */
export function wholeColRange(col: number, rowCount: number): CellRange {
  return createRange({ row: 0, col }, { row: Math.max(rowCount - 1, 0), col })
}

/** 渲染尺寸 = max(props, sheet.rows/cols)，与 SheetGrid 一致 */
export function resolveRenderSize(
  propsRows: number | undefined,
  propsCols: number | undefined,
  sheetRows: number,
  sheetCols: number
): { rows: number; cols: number } {
  return { rows: Math.max(propsRows ?? 100, sheetRows), cols: Math.max(propsCols ?? 26, sheetCols) }
}

function insertCountRender(options: {
  prefix: string
  suffix: string
  defaultValue: number
  onConfirm: (n: number) => void
}): ContextmenuItem['render'] {
  return defineComponent({
    name: 'SheetInsertCountMenuRender',
    setup() {
      return () =>
        h(InsertCountMenuItem, {
          prefix: options.prefix,
          suffix: options.suffix,
          defaultValue: options.defaultValue,
          min: INSERT_COUNT_MIN,
          max: INSERT_COUNT_MAX,
          onConfirm: options.onConfirm
        })
    }
  })
}

function primaryRange(ctx: SheetContext): CellRange | null {
  return ctx.getSelection().ranges[0] ?? null
}

/** 行号右键菜单：插入×2 / 删除 / divider / 冻结 / 取消冻结 */
export function buildRowHeaderMenus(ctx: SheetContext): ContextmenuItem[] {
  const range = primaryRange(ctx)
  const startRow = range?.start.row ?? 0
  const endRow = range?.end.row ?? startRow
  const rowCount = defaultInsertCount(range, 'row')
  const deleteCount = range ? endRow - startRow + 1 : 1
  const frozen = ctx.frozen
  const freezeActive = frozen.rows === endRow + 1

  return [
    {
      label: '在上方插入行',
      keepOpen: true,
      render: insertCountRender({
        prefix: '在上方插入',
        suffix: '行',
        defaultValue: rowCount,
        onConfirm: (n) => ctx.insertRows(startRow, n)
      })
    },
    {
      label: '在下方插入行',
      keepOpen: true,
      render: insertCountRender({
        prefix: '在下方插入',
        suffix: '行',
        defaultValue: rowCount,
        onConfirm: (n) => ctx.insertRows(endRow + 1, n)
      })
    },
    { label: '删除行', callback: () => ctx.deleteRows(startRow, deleteCount) },
    { divider: true },
    {
      label: freezeActive ? '✓ 冻结到当前行' : '冻结到当前行',
      callback: () => ctx.setFrozen(endRow + 1, frozen.cols)
    },
    {
      label: '取消冻结',
      disabled: frozen.rows === 0 && frozen.cols === 0,
      callback: () => ctx.setFrozen(0, 0)
    }
  ]
}

/** 列头右键菜单：插入×2 / 删除 / divider / 冻结 / 取消冻结 */
export function buildColHeaderMenus(ctx: SheetContext): ContextmenuItem[] {
  const range = primaryRange(ctx)
  const startCol = range?.start.col ?? 0
  const endCol = range?.end.col ?? startCol
  const colCount = defaultInsertCount(range, 'col')
  const deleteCount = range ? endCol - startCol + 1 : 1
  const frozen = ctx.frozen
  const freezeActive = frozen.cols === endCol + 1

  return [
    {
      label: '在左侧插入列',
      keepOpen: true,
      render: insertCountRender({
        prefix: '在左侧插入',
        suffix: '列',
        defaultValue: colCount,
        onConfirm: (n) => ctx.insertCols(startCol, n)
      })
    },
    {
      label: '在右侧插入列',
      keepOpen: true,
      render: insertCountRender({
        prefix: '在右侧插入',
        suffix: '列',
        defaultValue: colCount,
        onConfirm: (n) => ctx.insertCols(endCol + 1, n)
      })
    },
    { label: '删除列', callback: () => ctx.deleteCols(startCol, deleteCount) },
    { divider: true },
    {
      label: freezeActive ? '✓ 冻结到当前列' : '冻结到当前列',
      callback: () => ctx.setFrozen(frozen.rows, endCol + 1)
    },
    {
      label: '取消冻结',
      disabled: frozen.rows === 0 && frozen.cols === 0,
      callback: () => ctx.setFrozen(0, 0)
    }
  ]
}

/** body 格右键菜单：合并/取消合并 + 插入图片（行列插入/删除仅行号/列头菜单） */
export function buildBodyMenus(ctx: SheetContext): ContextmenuItem[] {
  const mergeTool = defaultToolRegistry.get('merge')
  const unmergeTool = defaultToolRegistry.get('unmerge')
  const active = ctx.getSelection().activeCell

  return [
    {
      label: '合并单元格',
      disabled: mergeTool?.disabled?.(ctx) ?? true,
      callback: () => mergeTool?.onClick(ctx)
    },
    {
      label: '取消合并单元格',
      disabled: unmergeTool?.disabled?.(ctx) ?? true,
      callback: () => unmergeTool?.onClick(ctx)
    },
    { label: '插入图片', disabled: !active, callback: () => pickAndInsertImage(ctx) }
  ]
}

/**
 * 右键落点预处理：body 格落在选区外 → 选中该格；
 * 行号/列头落在选区外 → 选中整行/整列（渲染尺寸）。
 */
export function ensureContextMenuSelection(
  ctx: SheetContext,
  info: {
    kind: 'body' | 'row-header' | 'col-header'
    addr: CellAddress | null
    row?: number
    col?: number
  },
  renderSize: { rows: number; cols: number }
): void {
  const ranges = ctx.getSelection().ranges

  if (info.kind === 'body' && info.addr) {
    const inSelection = ranges.some(
      (range) =>
        range.start.row <= info.addr!.row &&
        info.addr!.row <= range.end.row &&
        range.start.col <= info.addr!.col &&
        info.addr!.col <= range.end.col
    )
    if (!inSelection) ctx.selectCell(info.addr)
    return
  }

  if (info.kind === 'row-header' && info.row != null) {
    if (!isRowInSelection(ranges, info.row)) {
      ctx.selectRange(wholeRowRange(info.row, renderSize.cols))
    }
    return
  }

  if (info.kind === 'col-header' && info.col != null) {
    if (!isColInSelection(ranges, info.col)) {
      ctx.selectRange(wholeColRange(info.col, renderSize.rows))
    }
  }
}
