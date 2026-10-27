import { describe, expect, it, vi } from 'vite-plus/test'

import type { SheetContext } from '../context'
import { exportWorkbookFile } from '../download'

const mocks = vi.hoisted(() => ({
  saveBlob: vi.fn(),
  exportWorkbookXlsx: vi.fn(() => new Uint8Array([1, 2, 3])),
  exportSheetCsv: vi.fn(() => 'csv')
}))

vi.mock('@cat-kit/fe', () => ({ saveBlob: mocks.saveBlob }))

vi.mock('infinitable/sheet', async (importActual) => {
  const actual = await importActual<typeof import('infinitable/sheet')>()
  return {
    ...actual,
    exportWorkbookXlsx: mocks.exportWorkbookXlsx,
    exportSheetCsv: mocks.exportSheetCsv
  }
})

/** 最小 workbook 形状：download.ts 只读 name / snapshot / activeSheetIndex / activeSheet.name */
function makeCtx(): SheetContext {
  const workbook = {
    getSheets: () => [{ name: 'S1', snapshot: () => ({ cells: [] }) }],
    activeSheetIndex: 0,
    activeSheet: { name: 'S1' }
  }
  return { workbook } as unknown as SheetContext
}

/** postMessage 后按预设响应回消息的 worker 替身 */
class FakeWorker {
  static respond: ((worker: FakeWorker) => void) | undefined
  onmessage: ((e: { data: unknown }) => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  terminated = false
  postMessage(): void {
    const respond = FakeWorker.respond
    if (respond) queueMicrotask(() => respond(this))
  }
  terminate(): void {
    this.terminated = true
  }
}

function useFakeWorker(): () => void {
  const original = globalThis.Worker
  globalThis.Worker = FakeWorker as unknown as typeof Worker
  return () => {
    globalThis.Worker = original
    FakeWorker.respond = undefined
  }
}

describe('exportWorkbookFile worker 降级', () => {
  it('worker { ok: false }：不 reject，回退主线程 exportWorkbookXlsx 并照常下载', async () => {
    const restore = useFakeWorker()
    FakeWorker.respond = (worker) => {
      worker.onmessage?.({ data: { ok: false, error: 'bare specifier boom' } })
    }
    try {
      await expect(exportWorkbookFile(makeCtx())).resolves.toBeUndefined()

      expect(mocks.exportWorkbookXlsx).toHaveBeenCalledTimes(1)
      expect(mocks.saveBlob).toHaveBeenCalledTimes(1)
      const [blob, filename] = mocks.saveBlob.mock.calls[0]!
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      expect(filename).toBe('S1.xlsx')
    } finally {
      restore()
    }
  })

  it('worker { ok: true }：使用 worker 产物，不回退主线程', async () => {
    const restore = useFakeWorker()
    FakeWorker.respond = (worker) => {
      worker.onmessage?.({ data: { ok: true, buffer: new Uint8Array([9, 9, 9]) } })
    }
    try {
      await exportWorkbookFile(makeCtx())
      expect(mocks.exportWorkbookXlsx).not.toHaveBeenCalled()
      const [blob] = mocks.saveBlob.mock.calls[0]!
      const bytes = new Uint8Array(await blob.arrayBuffer())
      expect(Array.from(bytes)).toEqual([9, 9, 9])
    } finally {
      restore()
    }
  })

  it('worker 失败且主线程也抛错：错误向调用方传播（导出面板负责提示）', async () => {
    const restore = useFakeWorker()
    FakeWorker.respond = (worker) => {
      worker.onmessage?.({ data: { ok: false, error: 'boom' } })
    }
    mocks.exportWorkbookXlsx.mockImplementationOnce(() => {
      throw new Error('非法表名')
    })
    try {
      await expect(exportWorkbookFile(makeCtx())).rejects.toThrow('非法表名')
      expect(mocks.saveBlob).not.toHaveBeenCalled()
    } finally {
      restore()
    }
  })
})
