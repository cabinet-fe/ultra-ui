import type { SheetSnapshot } from '@veltra/sheet-core'

export type PreviewGridSizeMode = 'template' | 'filled'

/**
 * 报表预览网格尺寸：只铺到实际内容，不用设计态 canvas / 50×10 下限。
 *
 * - `template`：取数前的静态结构，按 cells/merges/meta 包围盒（忽略 snapshot.rows/cols，
 *   那是设计网格声明尺寸，会带出空白格）
 * - `filled`：行保留展开布局的 `snapshot.rows`（可能含无存值的空扩展行）；列按包围盒收敛
 *   （Filled Report 的 `cols` 常被 `max(layout, template.cols)` 撑到设计态列数）
 */
export function previewGridSize(
  snapshot: Pick<SheetSnapshot, 'cells' | 'merges' | 'meta' | 'rows'>,
  mode: PreviewGridSizeMode
): { rows: number; cols: number } {
  let maxRow = -1
  let maxCol = -1
  const grow = (row: number, col: number): void => {
    if (row > maxRow) maxRow = row
    if (col > maxCol) maxCol = col
  }
  for (const cell of snapshot.cells) grow(cell.row, cell.col)
  for (const merge of snapshot.merges) grow(merge.end.row, merge.end.col)
  for (const item of snapshot.meta ?? []) grow(item.row, item.col)

  const boundRows = maxRow + 1
  const boundCols = maxCol + 1
  if (mode === 'filled') {
    return { rows: Math.max(boundRows, snapshot.rows, 1), cols: Math.max(boundCols, 1) }
  }
  return { rows: Math.max(boundRows, 1), cols: Math.max(boundCols, 1) }
}
