import type { Sheet } from '@veltra/sheet-core'

import type { ReportColWidthEntry } from '../../../report/export-xlsx'
import { TABLE_ADDR_OFFSET } from './cell-coords'

/** 列宽读写目标：Sheet 模型或 SheetGrid.getTable() 的最小接口（headless 测试可桩） */
export type ColWidthTarget = {
  getTable: () => {
    setColWidth: (col: number, width: number) => void
    getColWidth: (col: number) => number
  }
}

/** 将模型列宽写入 VTable（模型 → grid 同步辅助） */
export function applyGridColWidths(
  grid: ColWidthTarget | undefined | null,
  widths: ReadonlyArray<ReportColWidthEntry>
): void {
  if (!grid) return
  const table = grid.getTable()
  for (const [sheetCol, width] of widths) {
    table.setColWidth(sheetCol + TABLE_ADDR_OFFSET, width)
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
  return cols.map((sheetCol) => [sheetCol, table.getColWidth(sheetCol + TABLE_ADDR_OFFSET)])
}
