import { message, messageConfirm } from '@veltra/desktop'
import {
  importCsv,
  importXlsx,
  replaceWorkbookWithSnapshots
} from '@veltra/sheet-core/core/io/import'
import type { Sheet, SheetSnapshot } from '@veltra/sheet-core/core/sheet'
import type { Workbook } from '@veltra/sheet-core/core/workbook'
import { nextFrame } from '@veltra/utils'
import type { Ref } from 'vue'

import type { ImportWorkerResponse } from './popups/import.worker'

/** 导入文件 accept（工具栏直接选文件） */
export const IMPORT_FILE_ACCEPT = '.xlsx,.csv'

/** 导入所需上下文（vue 层编排；tools 层不 import vue） */
export interface ImportFileOptions {
  workbook: Workbook
  activeSheet: Sheet
  /** xlsx worker 解析期 → grid 遮罩 */
  parsing?: Ref<boolean>
  /** worker 分片构建进度 */
  parseProgress?: Ref<{ done: number; total: number }>
  /** csv 导入完成（可能扩张尺寸，宿主需重建网格） */
  onCsvImported?: () => void
  /** xlsx 已替换工作簿（宿主需同步 tabs / 重绑 / 重建） */
  onWorkbookReplaced?: () => void
}

type ParsedXlsx = { sheets: { name: string; snapshot: SheetSnapshot }[]; activeIndex: number }

/**
 * xlsx 解析（worker 优先）：importXlsx 是同步重活，主线程直接跑会冻结 UI。
 * worker 返回纯数据快照；不可用时回退主线程解析。
 */
async function parseXlsxAsync(
  buffer: ArrayBuffer,
  parseProgress?: Ref<{ done: number; total: number }>
): Promise<ParsedXlsx> {
  let worker: Worker | undefined
  try {
    // new URL 模式：dev（vite）与 build（rolldown）都支持把 worker 提为独立 chunk
    const url = import.meta.env?.DEV
      ? new URL('./popups/import.worker.ts', import.meta.url)
      : new URL('./popups/import.worker.js', import.meta.url)
    worker = new Worker(url, { type: 'module' })
  } catch {
    return toSnapshotArray(await importXlsx(new Uint8Array(buffer)))
  }
  return await new Promise<ParsedXlsx>((resolve, reject) => {
    let settled = false
    const fallback = (): void => {
      if (settled) return
      settled = true
      worker!.terminate()
      void importXlsx(new Uint8Array(buffer))
        .then((wb) => resolve(toSnapshotArray(wb)))
        .catch((err: unknown) => reject(err))
    }
    worker!.onmessage = (e: MessageEvent<ImportWorkerResponse>) => {
      const data = e.data
      if (data.type === 'progress') {
        if (parseProgress) parseProgress.value = { done: data.done, total: data.total }
        return
      }
      if (settled) return
      settled = true
      if (!data.ok) {
        worker!.terminate()
        reject(new Error(data.error ?? 'worker 解析失败'))
        return
      }
      worker!.terminate()
      resolve({ sheets: data.sheets ?? [], activeIndex: data.activeIndex ?? 0 })
    }
    worker!.onerror = () => fallback()
    // transfer 一份拷贝给 worker；主线程保留原 buffer 供降级解析
    const transfer = buffer.slice(0)
    worker!.postMessage({ buffer: transfer }, [transfer])
  })
}

function toSnapshotArray(wb: Workbook): ParsedXlsx {
  return {
    sheets: wb.getSheets().map((s) => ({ name: s.name, snapshot: s.snapshot() })),
    activeIndex: wb.activeSheetIndex
  }
}

/**
 * 从本地 File 导入：
 * - .csv → importCsv 写入当前活动表
 * - .xlsx → 解析后经 messageConfirm 确认再 replaceWorkbookWithSnapshots
 */
export function importFromFile(file: File, options: ImportFileOptions): void {
  const { workbook, activeSheet, parsing, parseProgress, onCsvImported, onWorkbookReplaced } =
    options

  if (file.name.toLowerCase().endsWith('.csv')) {
    void file.text().then((text) => {
      importCsv(text, activeSheet)
      onCsvImported?.()
      message.success(`已从 ${file.name} 导入到工作表「${activeSheet.name}」`)
    })
    return
  }

  void file.arrayBuffer().then((buffer) => {
    if (parsing) parsing.value = true
    if (parseProgress) parseProgress.value = { done: 0, total: 0 }
    void parseXlsxAsync(buffer, parseProgress)
      .then((imported) => {
        if (parsing) parsing.value = false
        messageConfirm.danger(
          `导入将替换当前工作簿（共 ${imported.sheets.length} 个工作表），确定吗？`,
          {
            confirmButtonText: '导入',
            onClosed: (action) => {
              if (action !== 'confirm') return
              const loading = message({ message: '正在导入…', duration: 0 })
              try {
                replaceWorkbookWithSnapshots(workbook, imported.sheets, imported.activeIndex)
                onWorkbookReplaced?.()
                nextFrame(() => {
                  message.success('导入完成')
                  loading.close()
                })
              } catch (err) {
                console.error('[sheet] 导入失败：', err)
                message.error(`导入失败：${err instanceof Error ? err.message : String(err)}`)
                loading.close()
              }
            }
          }
        )
      })
      .catch((err: unknown) => {
        if (parsing) parsing.value = false
        message.error(`文件解析失败：${err instanceof Error ? err.message : String(err)}`)
      })
  })
}

/**
 * 拉起系统文件选择框（工具栏导入用；不用 UFilePicker——无编程式打开 API）。
 * 选中文件后走 importFromFile。
 */
export function pickAndImportFile(options: ImportFileOptions): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = IMPORT_FILE_ACCEPT
  input.hidden = true
  const cleanup = (): void => {
    input.remove()
  }
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    cleanup()
    if (file) importFromFile(file, options)
  })
  window.addEventListener(
    'focus',
    () => {
      setTimeout(() => {
        if (document.body.contains(input) && !input.files?.length) cleanup()
      }, 300)
    },
    { once: true }
  )
  document.body.appendChild(input)
  input.click()
}
