import type { ReportColWidthEntry } from '../../../report/export-xlsx'
import { TABLE_ADDR_OFFSET } from './cell-coords'

/** 列宽读写目标：SheetGrid.getTable() 的最小接口（headless 测试可桩）。
 *  sheet-core 列宽未进 SheetSnapshot，只能经 VTable 运行时 set/getColWidth。 */
export type ColWidthTarget = {
  getTable: () => {
    setColWidth: (col: number, width: number) => void
    getColWidth: (col: number) => number
  }
}

/** 经 SheetGrid → VTable 写入指定列宽 */
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

/** 从当前网格读取指定模型列宽度；网格未就绪时返回 null */
export function readGridColWidths(
  grid: ColWidthTarget | undefined | null,
  cols: ReadonlyArray<number>
): Array<[number, number]> | null {
  if (!grid) return null
  const table = grid.getTable()
  return cols.map((sheetCol) => [sheetCol, table.getColWidth(sheetCol + TABLE_ADDR_OFFSET)])
}
