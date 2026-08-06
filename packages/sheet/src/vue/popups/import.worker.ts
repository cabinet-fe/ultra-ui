/// <reference lib="webworker" />
/**
 * XLSX 解析 Worker：hucre 解析 + 模型构建（大文件 3~4s 同步重活）
 * 移到独立线程，主线程保持空闲（loading 动画正常、交互不冻结）。
 *
 * 协议：主线程 postMessage({ buffer: ArrayBuffer }) → worker 返回
 * - { type: 'progress', done, total }（模型分片构建进度，readXlsx 同步解析段无进度）
 * - { type: 'done', ok: true, sheets: [{ name, snapshot }], activeIndex }（快照为
 *   纯数据，可结构化克隆）；失败 { type: 'done', ok: false, error }。
 *
 * 名字唯一化与活动表对齐由 buildWorkbookFromHucre 完成（worker 内），主线程
 * 直接把快照替换进目标（无 undo 历史——替换语义由确认后的 replaceWorkbook 负责）。
 *
 * 注意：必须用**运行时动态 import**——worker 顶层静态 import 在 vite dev 的
 * worker 上下文中会因模块图加载顺序导致 `Workbook is not defined`（实测）。
 */
import type { SheetSnapshot } from '@veltra/sheet-core/core/sheet'

export type ImportWorkerResponse =
  | { type: 'progress'; done: number; total: number }
  | {
      type: 'done'
      ok: true
      sheets: { name: string; snapshot: SheetSnapshot }[]
      activeIndex: number
    }
  | { type: 'done'; ok: false; error: string }

self.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer }>): void => {
  const { buffer } = e.data
  void (async () => {
    try {
      const [{ readXlsx }, { buildWorkbookFromHucre }] = await Promise.all([
        import('hucre/xlsx'),
        import('@veltra/sheet-core/core/io/import')
      ])
      const hucreWb = await readXlsx(new Uint8Array(buffer), { readStyles: true })
      // 分片构建：按 10% 粒度回报进度（避免 196 条/秒的消息风暴与文字跳变过快；
      // 模型构建段约 1s，10 次更新肉眼可见数字推进）
      let lastPercent = -1
      const wb = buildWorkbookFromHucre(hucreWb, (done, total) => {
        const percent = total > 0 ? Math.floor((done / total) * 10) : 10
        if (percent !== lastPercent || done === total) {
          lastPercent = percent
          const progress: ImportWorkerResponse = { type: 'progress', done, total }
          ;(self as unknown as Worker).postMessage(progress)
        }
      })
      const sheets = wb.getSheets().map((s) => ({ name: s.name, snapshot: s.snapshot() }))
      const response: ImportWorkerResponse = {
        type: 'done',
        ok: true,
        sheets,
        activeIndex: wb.activeSheetIndex
      }
      ;(self as unknown as Worker).postMessage(response)
    } catch (err: unknown) {
      const response: ImportWorkerResponse = {
        type: 'done',
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      }
      ;(self as unknown as Worker).postMessage(response)
    }
  })()
}
