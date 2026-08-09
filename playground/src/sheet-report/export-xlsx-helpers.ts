import type { ColumnDef } from 'hucre'

import type { DemoColWidthEntry } from './template'

/** VTable 像素列宽 → Excel 字符宽度（近似换算） */
export function pxToExcelColWidth(px: number): number {
  return Math.max(1, Math.round((px - 5) / 7))
}

/** 从演示列宽条目构建 hucre ColumnDef */
export function buildColumnDefs(colWidths: ReadonlyArray<DemoColWidthEntry>): ColumnDef[] {
  if (colWidths.length === 0) return []
  const maxCol = Math.max(...colWidths.map(([col]) => col))
  const columns: ColumnDef[] = Array.from({ length: maxCol + 1 }, () => ({}))
  for (const [col, width] of colWidths) {
    columns[col] = { width: pxToExcelColWidth(width) }
  }
  return columns
}
