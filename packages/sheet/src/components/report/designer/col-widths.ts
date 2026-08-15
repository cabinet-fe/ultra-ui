import type { Sheet } from '@veltra/sheet-core'

import type { ReportColWidthEntry } from '../../../report/export-xlsx'

/** VTable 列宽读写所需的最小表接口（含行号列探测，隐藏行头时偏移为 0） */
type VTableColWidthApi = {
  setColWidth: (col: number, width: number) => void
  getColWidth: (col: number) => number
  readonly colCount: number
  readonly columnHeaderLevelCount: number
  isSeriesNumber: (col: number, row: number) => boolean
}

/** 列宽读写目标：Sheet 模型或 SheetGrid.getTable() 的最小接口（headless 测试可桩） */
export type ColWidthTarget = { getTable: () => VTableColWidthApi }

/** 行号列数（隐藏行头时为 0；与 GridCoords 探测一致） */
function seriesNumberColCount(table: VTableColWidthApi): number {
  const rowOffset = table.columnHeaderLevelCount
  let col = 0
  while (col < table.colCount && table.isSeriesNumber(col, rowOffset)) col++
  return col
}

/** 将模型列宽写入 VTable（模型 → grid 同步辅助） */
export function applyGridColWidths(
  grid: ColWidthTarget | undefined | null,
  widths: ReadonlyArray<ReportColWidthEntry>
): void {
  if (!grid) return
  const table = grid.getTable()
  const colOffset = seriesNumberColCount(table)
  for (const [sheetCol, width] of widths) {
    table.setColWidth(sheetCol + colOffset, width)
  }
}

/** 把列宽条目写入 Sheet 模型（不进 undo，对称 setColWidth） */
export function applySheetColWidths(
  sheet: Sheet | undefined | null,
  widths: ReadonlyArray<ReportColWidthEntry>
): void {
  if (!sheet) return
  for (const [col, width] of widths) sheet.setColWidth(col, width)
}

/** 从当前网格读取指定模型列宽度；网格未就绪时返回 null */
export function readGridColWidths(
  grid: ColWidthTarget | undefined | null,
  cols: ReadonlyArray<number>
): Array<[number, number]> | null {
  if (!grid) return null
  const table = grid.getTable()
  const colOffset = seriesNumberColCount(table)
  return cols.map((sheetCol) => [sheetCol, table.getColWidth(sheetCol + colOffset)])
}
