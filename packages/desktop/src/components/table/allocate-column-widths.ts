import type { ColumnNode } from './node/col'

/**
 * 按容器宽度分配叶子列宽。
 *
 * - `explicitWidth` 列：保持配置/拖拽锁定的宽度
 * - `fixed` 且未显式设宽的列：保持 `minWidth`，不参与剩余宽度均分
 * - 其余未显式设宽的列：均分容器剩余宽度
 */
export function allocateLeafColumnWidths(leafColumns: ColumnNode[], containerWidth: number): void {
  if (!containerWidth || !leafColumns.length) return

  const growColumns = leafColumns.filter((column) => !column.explicitWidth && !column.fixed)
  // fixed 且未显式设宽：清掉可能被旧算法撑大的残留 width，回落到 minWidth
  const fixedFlexColumns = leafColumns.filter((column) => !column.explicitWidth && column.fixed)

  fixedFlexColumns.forEach((column) => {
    column.data.width = undefined
  })

  const explicitWidthTotal = leafColumns
    .filter((column) => column.explicitWidth)
    .reduce((acc, cur) => acc + (cur.width ?? cur.minWidth!), 0)
  const growBaseTotal = growColumns.reduce((acc, cur) => acc + cur.minWidth!, 0)
  const fixedFlexBaseTotal = fixedFlexColumns.reduce((acc, cur) => acc + cur.minWidth!, 0)
  const totalBase = explicitWidthTotal + growBaseTotal + fixedFlexBaseTotal

  if (growColumns.length > 0 && totalBase < containerWidth) {
    const allocatedWidth = (containerWidth - totalBase) / growColumns.length
    growColumns.forEach((column) => {
      column.width = column.minWidth! + allocatedWidth
    })
  } else {
    growColumns.forEach((column) => {
      column.data.width = undefined
    })
  }
}
