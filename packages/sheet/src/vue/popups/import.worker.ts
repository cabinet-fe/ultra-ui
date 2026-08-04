/// <reference lib="webworker" />
/**
 * XLSX 解析 Worker：importXlsx（hucre 解析 + 模型构建，大文件 3~4s 同步重活）
 * 移到独立线程，主线程保持空闲（loading 动画正常、交互不冻结）。
 *
 * 协议：主线程 postMessage({ buffer: ArrayBuffer }) → worker 返回
 * { ok: true, sheets: [{ name, snapshot }], activeIndex }（快照为纯数据，
 * 可结构化克隆）；失败返回 { ok: false, error }。
 *
 * 名字唯一化与活动表对齐由 importXlsx 完成（worker 内），主线程按快照重建
 * Workbook（restore 静默恢复，无 undo 历史——解析阶段的 undo 无意义，
 * 替换语义由确认后的 replaceWorkbook 负责）。
 *
 * 注意：必须用**运行时动态 import**——worker 顶层静态 import 在 vite dev 的
 * worker 上下文中会因模块图加载顺序导致 `Workbook is not defined`（实测）。
 */
import type { SheetSnapshot } from '../../core/sheet'

export interface ImportWorkerResponse {
  ok: boolean
  sheets?: { name: string; snapshot: SheetSnapshot }[]
  activeIndex?: number
  error?: string
}

self.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer }>): void => {
  const { buffer } = e.data
  void import('../../core/io/import')
    .then(({ importXlsx }) => importXlsx(new Uint8Array(buffer)))
    .then((wb) => {
      const sheets = wb.getSheets().map((s) => ({ name: s.name, snapshot: s.snapshot() }))
      const response: ImportWorkerResponse = { ok: true, sheets, activeIndex: wb.activeSheetIndex }
      ;(self as unknown as Worker).postMessage(response)
    })
    .catch((err: unknown) => {
      const response: ImportWorkerResponse = {
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      }
      ;(self as unknown as Worker).postMessage(response)
    })
}
