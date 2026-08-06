import type { Sheet } from '@veltra/sheet-core/core/sheet'
import { Workbook } from '@veltra/sheet-core/core/workbook'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { IMPORT_FILE_ACCEPT, importFromFile, pickAndImportFile } from '../import-file'

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
        getSheets: () => [{ name: 'S1', snapshot: () => EMPTY_SNAPSHOT }],
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

vi.mock('@veltra/desktop', () => ({ message: mocks.message, messageConfirm: mocks.messageConfirm }))

vi.mock('@veltra/sheet-core/core/io/import', () => ({
  importCsv: mocks.importCsv,
  importXlsx: mocks.importXlsx,
  replaceWorkbookWithSnapshots: mocks.replaceWorkbookWithSnapshots
}))

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

/** 触发 xlsx 导入并等异步链（arrayBuffer → importXlsx → danger）完成 */
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
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

/** 取 messageConfirm.danger 注册的 onClosed 回调 */
function getOnClosed(): (action: string) => void {
  const opts = mocks.messageConfirm.danger.mock.calls[0]![1] as {
    onClosed: (action: string) => void
  }
  return opts.onClosed
}

afterEach(() => {
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
      [{ name: 'S1', snapshot: EMPTY_SNAPSHOT }],
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
