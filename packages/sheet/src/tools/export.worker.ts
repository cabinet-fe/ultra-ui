/// <reference lib="webworker" />
/**
 * XLSX 导出 Worker：exportWorkbookXlsx（模型 → hucre 序列化 + ZIP 压缩，
 * 大工作簿为秒级同步重活）移到独立线程，主线程保持空闲。
 *
 * 协议：主线程 postMessage({ sheets: [{ name, snapshot }], activeIndex }）
 * （快照为纯数据，可结构化克隆，行高随 SheetSnapshot.rowHeights 携带）→
 * worker 返回 { ok: true, buffer }（精确拷贝后 transfer 回主线程）；
 * 失败返回 { ok: false, error }。
 *
 * 与 import.worker.ts 同一约束：必须用**运行时动态 import**——worker 顶层
 * 静态 import 在 vite dev 的 worker 上下文中会因模块图加载顺序导致
 * `Workbook is not defined`（实测）。
 */
import type { SheetSnapshot } from '@veltra/sheet-core/core/sheet'

export interface ExportWorkerPayload {
  sheets: { name: string; snapshot: SheetSnapshot }[]
  activeIndex: number
}

export interface ExportWorkerResponse {
  ok: boolean
  buffer?: Uint8Array
  error?: string
}

self.onmessage = (e: MessageEvent<ExportWorkerPayload>): void => {
  void Promise.all([
    import('@veltra/sheet-core/core/io/export'),
    import('@veltra/sheet-core/core/workbook')
  ])
    .then(([{ exportWorkbookXlsx }, { Workbook }]) => {
      const wb = new Workbook()
      const sheets = e.data.sheets
      for (let i = 0; i < sheets.length; i++) {
        const { name, snapshot } = sheets[i]!
        // 首个 sheet 复用 Workbook 自带的默认表：先改名对齐（空名/重名保持原名，
        // 导出侧 hucre 1.0 会校验表名合法性）
        const sheet = i === 0 ? wb.activeSheet : wb.addSheet(name)
        if (i === 0 && sheet.name !== name) wb.renameSheet(sheet.name, name)
        sheet.restore(snapshot)
      }
      wb.activateSheet(wb.getSheets()[Math.min(e.data.activeIndex, wb.sheetCount - 1)]!.name)
      return exportWorkbookXlsx(wb)
    })
    .then((buffer) => {
      // transfer 精确视图（writeXlsx 返回的 Uint8Array 理论上独占底层 buffer，
      // slice 一份拷贝兜底偏移情形，避免 transfer 整个底层 buffer 带出冗余字节）
      const exact = buffer.slice()
      const response: ExportWorkerResponse = { ok: true, buffer: exact }
      ;(self as unknown as Worker).postMessage(response, [exact.buffer])
    })
    .catch((err: unknown) => {
      const response: ExportWorkerResponse = {
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      }
      ;(self as unknown as Worker).postMessage(response)
    })
}
