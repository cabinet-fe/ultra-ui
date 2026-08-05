import { saveBlob } from '@cat-kit/fe'

import { exportSheetCsv, exportWorkbookXlsx } from '../core/io/export'
import type { SheetContext } from './context'

/**
 * 导出当前工作簿为 .xlsx（无 workbook 时空操作）。
 * 下载动作复用 @cat-kit/fe 的 saveBlob（#28：不再自研 Object URL + a.click）。
 */
export function exportWorkbookFile(ctx: SheetContext): void {
  const workbook = ctx.workbook
  if (!workbook) return
  void exportWorkbookXlsx(workbook).then((buffer) => {
    saveBlob(
      new Blob([buffer as unknown as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }),
      `${workbook.activeSheet.name || 'workbook'}.xlsx`
    )
  })
}

/** 导出当前工作表为 .csv（无 workbook 时空操作） */
export function exportSheetCsvFile(ctx: SheetContext): void {
  const workbook = ctx.workbook
  if (!workbook) return
  const csv = exportSheetCsv(workbook.activeSheet)
  saveBlob(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    `${workbook.activeSheet.name || 'sheet'}.csv`
  )
}
