import type { CellRef, ListTable, TableContextMenuEvent } from '@infinite-table/core'

import type { CellAddress } from '../core/address'

/** 右键落点区域：body 格 / 行号列 / 列头行（角点归 body，addr 为 null） */
export type SheetGridContextMenuKind = 'body' | 'row-header' | 'col-header'

/** 右键菜单回调参数（vue 层弹 UContextmenu；grid 不依赖 desktop） */
export interface SheetGridContextMenuInfo {
  x: number
  y: number
  /** 落点区域 */
  kind: SheetGridContextMenuKind
  /** body 格为模型地址；header / 角点为 null */
  addr: CellAddress | null
  /** row-header：模型行号 */
  row?: number
  /** col-header：模型列号 */
  col?: number
}

/** 引擎事件层坐标（相对容器）→ 客户端坐标（供 UContextmenu.pop mousePosition） */
export function clientPointFromTableEvent(
  container: HTMLElement,
  x: number,
  y: number
): { x: number; y: number } {
  const rect = container.getBoundingClientRect()
  return { x: rect.left + x, y: rect.top + y }
}

/** 可视窗口内反向定位：层坐标 x 落在哪一列（窗口外 / 空白返回 undefined） */
function findVisibleColAt(table: ListTable, x: number): number | undefined {
  const { cols } = table.getBodyVisibleCellRange()
  for (let col = cols.start; col < cols.end; col++) {
    const rect = table.getCellRelativeRect(col, 0)
    if (rect && x >= rect.x && x < rect.x + rect.width) return col
  }
  return undefined
}

/** 可视窗口内反向定位：层坐标 y 落在哪一行（窗口外 / 空白返回 undefined） */
function findVisibleRowAt(table: ListTable, y: number): number | undefined {
  const { rows } = table.getBodyVisibleCellRange()
  for (let row = rows.start; row < rows.end; row++) {
    const rect = table.getCellRelativeRect(0, row)
    if (rect && y >= rect.y && y < rect.y + rect.height) return row
  }
  return undefined
}

/**
 * 右键事件 → ContextMenuInfo：行号列 / 列头行 / body 分流（引擎已给 region，
 * 角点归 body 且 cell 为 null，与「保留当前选区」语义一致）。
 */
export function buildContextMenuInfo(
  table: ListTable,
  container: HTMLElement,
  event: TableContextMenuEvent
): SheetGridContextMenuInfo {
  const point = clientPointFromTableEvent(container, event.x, event.y)
  if (event.region === 'row-header') {
    const row = findVisibleRowAt(table, event.y)
    return { ...point, kind: 'row-header', addr: null, ...(row !== undefined ? { row } : {}) }
  }
  if (event.region === 'col-header') {
    const col = findVisibleColAt(table, event.x)
    return { ...point, kind: 'col-header', addr: null, ...(col !== undefined ? { col } : {}) }
  }
  const addr = cellRefToAddr(event.cell)
  return { ...point, kind: 'body', addr }
}

/** 引擎格引用 → 模型地址（行列头 / 空白为 null） */
export function cellRefToAddr(cell: CellRef | null): CellAddress | null {
  return cell ? { row: cell.row, col: cell.col } : null
}

/**
 * 容器内相对坐标 → 模型地址（行号/列头返回 null）。
 * 供宿主拖放等场景命中单元格。
 */
export function hitTestSheetAddr(
  table: ListTable,
  relativeX: number,
  relativeY: number
): CellAddress | null {
  const cell = table.getCellAtRelativePosition(relativeX, relativeY)
  return cellRefToAddr(cell)
}
