// @vitest-environment happy-dom

import type { Sheet } from 'infinitable/sheet'
import { Workbook } from 'infinitable/sheet'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { ref } from 'vue'

import { IMPORT_FILE_ACCEPT, importFromFile, pickAndImportFile } from '../import-file'

/**
 * worker 替身：happy-dom 自带 Worker（构造成功但 URL 不可加载，异步才触发
 * onerror），使回退时机不确定、既有用例偶发拿到空 danger 调用——统一替换为
 * 可编程替身。默认脚本为同步 onerror（worker 不可用 → 主线程回退），单测可
 * 按 scenario 覆写响应（如 { ok: false }）。
 */
type FakeMessageEvent = { data: unknown }
class FakeWorker {
  static script: (worker: FakeWorker) => void = (worker) => {
    queueMicrotask(() => worker.onerror?.(new Error('worker unavailable')))
  }
  static instances: FakeWorker[] = []
  onmessage: ((e: FakeMessageEvent) => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  terminated = false
  constructor() {
    FakeWorker.instances.push(this)
  }
  postMessage(): void {
    queueMicrotask(() => FakeWorker.script(this))
  }
  terminate(): void {
    this.terminated = true
  }
}
const defaultWorkerScript = FakeWorker.script
globalThis.Worker = FakeWorker as unknown as typeof Worker

const mocks = vi.hoisted(() => {
  const message = vi.fn(() => ({ close: vi.fn(), id: 'loading', onClosed: Promise.resolve() }))
  for (const type of ['success', 'warn', 'info', 'error', 'default']) {
    message[type] = vi.fn()
  }
  return {
    message,
    messageConfirm: { danger: vi.fn() },
    importCsv: vi.fn(),
    importXlsx: vi.fn(() =>
      Promise.resolve({
        getSheets: (): MockSheet[] => [
          { name: 'S1', snapshot: () => EMPTY_SNAPSHOT, defaultRowHeight: 20, defaultColWidth: 64 }
        ],
        activeSheetIndex: 0
      })
    ),
    replaceWorkbookWithSnapshots: vi.fn()
  }
})

/** 空表快照（快照数组路径的源数据） */
const EMPTY_SNAPSHOT = {
  cells: [],
  styles: [],
  merges: [],
  frozen: { rows: 0, cols: 0 },
  rows: 0,
  cols: 0
}

/** importXlsx mock 的 sheet 形状（默认尺寸可选：不写即未声明 → 不透传路径） */
type MockSheet = {
  name: string
  snapshot: () => typeof EMPTY_SNAPSHOT
  defaultRowHeight?: number
  defaultColWidth?: number
}

vi.mock('@veltra/desktop', () => ({ message: mocks.message, messageConfirm: mocks.messageConfirm }))

vi.mock('infinitable/sheet', async (importActual) => {
  const actual = await importActual<typeof import('infinitable/sheet')>()
  return {
    ...actual,
    importCsv: mocks.importCsv,
    importXlsx: mocks.importXlsx,
    replaceWorkbookWithSnapshots: mocks.replaceWorkbookWithSnapshots
  }
})

function makeOptions(
  overrides: {
    onWorkbookReplaced?: () => void
    onCsvImported?: () => void
    parsing?: ReturnType<typeof ref<boolean>>
  } = {}
) {
  const workbook = new Workbook()
  const activeSheet = workbook.activeSheet as Sheet
  return {
    workbook,
    activeSheet,
    parsing: overrides.parsing ?? ref(false),
    parseProgress: ref({ done: 0, total: 0 }),
    onCsvImported: overrides.onCsvImported,
    onWorkbookReplaced: overrides.onWorkbookReplaced
  }
}

/** 触发 xlsx 导入并等解析回退链完成（worker 替身 → 主线程 importXlsx → 确认弹层） */
async function triggerXlsxAndAwait(
  options: ReturnType<typeof makeOptions>,
  name = 'test.xlsx'
): Promise<void> {
  const file = {
    name,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    text: () => Promise.resolve('')
  } as File
  importFromFile(file, options)
  await vi.waitFor(() => expect(mocks.messageConfirm.danger).toHaveBeenCalledTimes(1))
}

/** 取 messageConfirm.danger 注册的 onClosed 回调 */
function getOnClosed(): (action: string) => void {
  const opts = mocks.messageConfirm.danger.mock.calls[0]![1] as {
    onClosed: (action: string) => void
  }
  return opts.onClosed
}

afterEach(() => {
  FakeWorker.script = defaultWorkerScript
  FakeWorker.instances = []
  vi.clearAllMocks()
  document.body.querySelectorAll('input[type="file"]').forEach((el) => el.remove())
})

describe('importFromFile 导入确认兜底', () => {
  it('确认后：loading 提示 → replaceWorkbookWithSnapshots → 成功提示', async () => {
    const replaced = vi.fn()
    const parsingRef = ref(false)
    const options = makeOptions({ onWorkbookReplaced: replaced, parsing: parsingRef })
    await triggerXlsxAndAwait(options)
    const onClosed = getOnClosed()
    await onClosed('confirm')

    expect(parsingRef.value).toBe(false)
    expect(mocks.message).toHaveBeenCalledWith(
      expect.objectContaining({ message: '正在导入…', duration: 0 })
    )
    expect(mocks.replaceWorkbookWithSnapshots).toHaveBeenCalledTimes(1)
    expect(mocks.replaceWorkbookWithSnapshots).toHaveBeenCalledWith(
      expect.anything(),
      [{ name: 'S1', snapshot: EMPTY_SNAPSHOT, defaultRowHeight: 20, defaultColWidth: 64 }],
      0
    )
    expect(replaced).toHaveBeenCalledTimes(1)
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
    expect(mocks.message.success).toHaveBeenCalledWith('导入完成')
  })

  it('replaceWorkbookWithSnapshots 抛错：报错提示 + 不误报成功 + 不通知宿主', async () => {
    const replaced = vi.fn()
    const options = makeOptions({ onWorkbookReplaced: replaced, parsing: ref(false) })
    await triggerXlsxAndAwait(options)
    const loadingClose = vi.fn()
    mocks.message.mockReturnValueOnce({
      close: loadingClose,
      id: 'loading',
      onClosed: Promise.resolve()
    })
    mocks.replaceWorkbookWithSnapshots.mockImplementationOnce(() => {
      throw new Error('内存不足 boom')
    })

    const onClosed = getOnClosed()
    await onClosed('confirm')

    expect(mocks.replaceWorkbookWithSnapshots).toHaveBeenCalledTimes(1)
    expect(replaced).not.toHaveBeenCalled()
    expect(mocks.message.error).toHaveBeenCalledWith('导入失败：内存不足 boom')
    expect(mocks.message.success).not.toHaveBeenCalled()
    expect(loadingClose).toHaveBeenCalledTimes(1)
  })

  it('取消（非 confirm）：不触发导入', async () => {
    const options = makeOptions({ parsing: ref(false) })
    await triggerXlsxAndAwait(options)
    const onClosed = getOnClosed()
    await onClosed('cancel')
    expect(mocks.replaceWorkbookWithSnapshots).not.toHaveBeenCalled()
    expect(mocks.message.success).not.toHaveBeenCalled()
    expect(mocks.message.error).not.toHaveBeenCalled()
  })

  it('csv：写入活动表并回调 onCsvImported', async () => {
    const csvImported = vi.fn()
    const options = makeOptions({ onCsvImported: csvImported })
    const file = {
      name: 'data.csv',
      text: () => Promise.resolve('a,b\n1,2'),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
    } as File
    importFromFile(file, options)
    await Promise.resolve()
    await Promise.resolve()
    expect(mocks.importCsv).toHaveBeenCalledWith('a,b\n1,2', options.activeSheet)
    expect(csvImported).toHaveBeenCalledTimes(1)
    expect(mocks.message.success).toHaveBeenCalledWith(
      expect.stringContaining('已从 data.csv 导入')
    )
  })
})

describe('importFromFile 默认行列尺寸透传', () => {
  it('文件未声明默认尺寸：条目不携带两字段（目标保持现状）', async () => {
    mocks.importXlsx.mockImplementationOnce(() =>
      Promise.resolve({
        getSheets: () => [{ name: 'S1', snapshot: () => EMPTY_SNAPSHOT }],
        activeSheetIndex: 0
      })
    )
    const options = makeOptions()
    await triggerXlsxAndAwait(options)
    const onClosed = getOnClosed()
    await onClosed('confirm')

    expect(mocks.replaceWorkbookWithSnapshots).toHaveBeenCalledTimes(1)
    const [entry] = mocks.replaceWorkbookWithSnapshots.mock.calls[0]![1]
    expect(entry).toEqual({ name: 'S1', snapshot: EMPTY_SNAPSHOT })
    expect(entry).not.toHaveProperty('defaultRowHeight')
    expect(entry).not.toHaveProperty('defaultColWidth')
  })
})

describe('pickAndImportFile', () => {
  it('创建隐藏 file input（同一 accept）并 click', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    pickAndImportFile(makeOptions())
    const input = document.body.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).toBeTruthy()
    expect(input!.accept).toBe(IMPORT_FILE_ACCEPT)
    expect(input!.hidden).toBe(true)
    expect(click).toHaveBeenCalled()
    click.mockRestore()
  })
})

describe('worker { ok: false } 主线程回退', () => {
  it('worker 内部失败：不 reject，回退主线程 importXlsx 并照常进入确认', async () => {
    FakeWorker.script = (worker) => {
      worker.onmessage?.({ data: { type: 'done', ok: false, error: 'bare specifier boom' } })
    }
    const replaced = vi.fn()
    const options = makeOptions({ onWorkbookReplaced: replaced })
    await triggerXlsxAndAwait(options)

    // 主线程回退确实发生：importXlsx 被调用、worker 已终止，且其结果进入确认 → 替换
    expect(mocks.importXlsx).toHaveBeenCalledTimes(1)
    expect(FakeWorker.instances[0]!.terminated).toBe(true)
    expect(mocks.message.error).not.toHaveBeenCalled()

    const onClosed = getOnClosed()
    await onClosed('confirm')
    expect(mocks.replaceWorkbookWithSnapshots).toHaveBeenCalledWith(
      expect.anything(),
      [{ name: 'S1', snapshot: EMPTY_SNAPSHOT, defaultRowHeight: 20, defaultColWidth: 64 }],
      0
    )
    expect(replaced).toHaveBeenCalledTimes(1)
  })
})
