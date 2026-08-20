import type { CellAddress } from '@veltra/sheet-core'
import type { SheetGrid } from '@veltra/sheet-core/grid'

export interface CellOverlayRect {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
  centerX: number
  centerY: number
}

export interface GridOverlayLayout {
  offsetX: number
  offsetY: number
  viewW: number
  viewH: number
}

/** VTable 坐标 = 模型地址 + 行号列/列头偏移（通常 +1） */
export const TABLE_ADDR_OFFSET = 1

export function resolveGridOverlayLayout(
  host: HTMLElement
): { gridEl: HTMLElement; layout: GridOverlayLayout } | null {
  const gridEl = host.querySelector('.u-sheet__grid-instance') as HTMLElement | null
  if (!gridEl) return null

  const hostBox = host.getBoundingClientRect()
  const gridBox = gridEl.getBoundingClientRect()

  return {
    gridEl,
    layout: {
      offsetX: gridBox.left - hostBox.left,
      offsetY: gridBox.top - hostBox.top,
      viewW: gridEl.clientWidth,
      viewH: gridEl.clientHeight
    }
  }
}

/** 将屏幕坐标换算为网格落点地址（用于字段拖拽 bind） */
export function resolveGridDropAddress(
  grid: SheetGrid,
  gridEl: HTMLElement,
  clientX: number,
  clientY: number
): CellAddress | null {
  const rect = gridEl.getBoundingClientRect()
  return grid.hitTestSheetAddr(clientX - rect.left, clientY - rect.top) ?? null
}

export function getCellOverlayRect(
  grid: SheetGrid,
  cell: CellAddress,
  layout: GridOverlayLayout
): CellOverlayRect | null {
  const table = grid.getTable()
  let cellRect: { left: number; top: number; right: number; bottom: number }
  try {
    cellRect = table.getCellRelativeRect(
      cell.col + TABLE_ADDR_OFFSET,
      cell.row + TABLE_ADDR_OFFSET
    ) as { left: number; top: number; right: number; bottom: number }
  } catch {
    return null
  }

  const left = layout.offsetX + cellRect.left
  const top = layout.offsetY + cellRect.top
  const right = layout.offsetX + cellRect.right
  const bottom = layout.offsetY + cellRect.bottom

  const outOfView =
    cellRect.bottom < 0 ||
    cellRect.right < 0 ||
    cellRect.top > layout.viewH ||
    cellRect.left > layout.viewW

  if (outOfView) return null

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2
  }
}
