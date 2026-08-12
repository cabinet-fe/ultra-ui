import type { CellRange } from '@veltra/sheet-core/core/address'
import type { SetAxisStyleItem } from '@veltra/sheet-core/core/command/set-axis-style'
import type { CellStylePatch } from '@veltra/sheet-core/core/style/types'

/** 样式写入目标：整行 / 整列默认样式，或逐格 */
export type SelectionStyleTarget = 'row' | 'col' | 'cell'

/**
 * 按选区相对渲染网格的跨度判定样式写入目标（对齐 Excel）：
 * - 跨满全部列且未跨满全部行 → 行默认样式（rowStyles）
 * - 跨满全部行且未跨满全部列 → 列默认样式（colStyles）
 * - 其余（含全表 / 局部）→ 单元格样式
 */
export function classifySelectionStyleTarget(
  range: CellRange,
  renderRows: number,
  renderCols: number
): SelectionStyleTarget {
  const cols = Math.max(renderCols, 1)
  const rows = Math.max(renderRows, 1)
  const spansAllCols = range.start.col === 0 && range.end.col >= cols - 1
  const spansAllRows = range.start.row === 0 && range.end.row >= rows - 1
  if (spansAllCols && !spansAllRows) return 'row'
  if (spansAllRows && !spansAllCols) return 'col'
  return 'cell'
}

/** 整行/整列选区 → set-axis-style 写入项（partial）或清除项（clear） */
export function axisStyleItemsForRange(
  range: CellRange,
  axis: 'row' | 'col',
  patch: { partial: CellStylePatch } | { clear: true }
): SetAxisStyleItem[] {
  const start = axis === 'row' ? range.start.row : range.start.col
  const end = axis === 'row' ? range.end.row : range.end.col
  const items: SetAxisStyleItem[] = []
  for (let index = start; index <= end; index++) {
    items.push({ index, ...patch })
  }
  return items
}
