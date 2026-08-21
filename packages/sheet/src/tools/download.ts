import { saveBlob } from '@cat-kit/fe'
import { exportSheetCsv, exportWorkbookXlsx } from '@veltra/sheet-core/core/io/export'
import type { Workbook } from '@veltra/sheet-core/core/workbook'

import type { SheetContext } from './context'
import type { ExportWorkerPayload, ExportWorkerResponse } from './export.worker'

/**
 * 大工作簿的 XLSX 导出（sheet-core 序列化 + ZIP 压缩为秒级同步重活）移入 Web Worker：
 * 主线程只采集快照（结构化克隆友好的纯数据，行高随 SheetSnapshot.rowHeights
 * 携带），序列化与压缩在 worker 线程进行。worker 不可用（极端环境 / 打包产物
 * 缺文件）回退主线程导出——与导入侧 parseXlsxAsync 同一模式。
 */
async function exportWorkbookXlsxAsync(workbook: Workbook): Promise<Uint8Array> {
  let worker: Worker | undefined
  try {
    // new URL 模式：dev（vite）与 build（rolldown）都支持把 worker 提为独立
    // chunk（与 import.worker 一致）；onerror 再兜底降级主线程
    const url = import.meta.env?.DEV
      ? new URL('./export.worker.ts', import.meta.url)
      : new URL('./export.worker.js', import.meta.url)
    worker = new Worker(url, { type: 'module' })
  } catch {
    return exportWorkbookXlsx(workbook)
  }
  const payload: ExportWorkerPayload = {
    sheets: workbook.getSheets().map((sheet) => ({ name: sheet.name, snapshot: sheet.snapshot() })),
    activeIndex: workbook.activeSheetIndex
  }
  return await new Promise<Uint8Array>((resolve, reject) => {
    let settled = false
    // worker 加载/启动失败（如打包产物缺文件）→ 降级主线程导出
    const fallback = (): void => {
      if (settled) return
      settled = true
      worker!.terminate()
      resolve(exportWorkbookXlsx(workbook))
    }
    worker!.onmessage = (e: MessageEvent<ExportWorkerResponse>) => {
      if (settled) return
      settled = true
      worker!.terminate()
      const data = e.data
      if (!data.ok || !data.buffer) {
        reject(new Error(data.error ?? 'worker 导出失败'))
        return
      }
      resolve(data.buffer)
    }
    worker!.onerror = () => fallback()
    worker!.postMessage(payload)
  })
}

/**
 * 导出当前工作簿为 .xlsx（无 workbook 时空操作）。
 * 下载动作复用 @cat-kit/fe 的 saveBlob（#28：不再自研 Object URL + a.click）。
 * 导出侧 sheet-core 的 writeXlsx 会校验 sheet 名（Excel 非法字符 / 超长 / 保留名）并抛
 * InvalidArgumentError——失败经返回的 Promise 传播，调用方（导出面板）负责提示。
 */
export async function exportWorkbookFile(ctx: SheetContext): Promise<void> {
  const workbook = ctx.workbook
  if (!workbook) return
  const buffer = await exportWorkbookXlsxAsync(workbook)
  saveBlob(
    new Blob([buffer as unknown as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),
    `${workbook.activeSheet.name || 'workbook'}.xlsx`
  )
}

/** 导出当前工作表为 .csv（无 workbook 时空操作；同步，异常直接抛给调用方） */
export function exportSheetCsvFile(ctx: SheetContext): void {
  const workbook = ctx.workbook
  if (!workbook) return
  const csv = exportSheetCsv(workbook.activeSheet)
  saveBlob(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    `${workbook.activeSheet.name || 'sheet'}.csv`
  )
}
