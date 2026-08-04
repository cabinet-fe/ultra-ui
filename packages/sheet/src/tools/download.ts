import { exportSheetCsv, exportWorkbookXlsx } from '../core/io/export'
import type { SheetContext } from './context'

/** 生成浏览器下载（Blob → 临时 URL → a.click） */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

/** 导出当前工作簿为 .xlsx（无 workbook 时空操作） */
export function exportWorkbookFile(ctx: SheetContext): void {
  const workbook = ctx.workbook
  if (!workbook) return
  void exportWorkbookXlsx(workbook).then((buffer) => {
    downloadBlob(
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
  downloadBlob(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    `${workbook.activeSheet.name || 'sheet'}.csv`
  )
}
