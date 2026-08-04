import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, provide, ref, type App } from 'vue'

import type { Sheet } from '../../core/sheet'
import { Workbook } from '../../core/workbook'
import { SHEET_PARSING_KEY } from '../parsing'
import USheetImportPopup from '../popups/import-popup.vue'

const mocks = vi.hoisted(() => {
  const message = vi.fn(() => ({ close: vi.fn(), id: 'loading', onClosed: Promise.resolve() }))
  // 真实 message 为函数 + 静态快捷方法（success/warn/info/error/default）
  for (const type of ['success', 'warn', 'info', 'error', 'default']) {
    message[type] = vi.fn()
  }
  return {
    message,
    messageConfirm: { danger: vi.fn() },
    importCsv: vi.fn(),
    importXlsx: vi.fn(() => Promise.resolve({ sheetCount: 2 })),
    replaceWorkbook: vi.fn()
  }
})

vi.mock('@veltra/desktop', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    message: mocks.message,
    messageConfirm: mocks.messageConfirm,
    // 用 render 函数而非 template 字符串：测试环境 runtime-only Vue 不编译
    // 内联 template（@click 监听不绑定），render 走 vnode props 必然生效
    UFilePicker: defineComponent({
      name: 'UFilePickerStub',
      props: ['accept'],
      emits: ['pick'],
      setup(_props, { emit }) {
        return () =>
          h(
            'button',
            {
              class: 'picker-stub-btn',
              onClick: () =>
                // UFilePicker 的 pick 事件载荷为 File[]（handleImportPick 取 files[0]）
                emit('pick', [
                  { name: 'test.xlsx', arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }
                ])
            },
            'pick'
          )
      }
    })
  }
})

vi.mock('../../core/io/import', () => ({
  importCsv: mocks.importCsv,
  importXlsx: mocks.importXlsx,
  replaceWorkbook: mocks.replaceWorkbook
}))

const apps: App[] = []
const containers: HTMLElement[] = []

function mountPopup(onWorkbookReplaced?: () => void, parsingRef?: ReturnType<typeof ref<boolean>>) {
  const workbook = new Workbook()
  const activeSheet = workbook.activeSheet as Sheet
  const el = document.createElement('div')
  document.body.appendChild(el)
  containers.push(el)
  const app = createApp({
    setup() {
      if (parsingRef) provide(SHEET_PARSING_KEY, parsingRef)
      return () => h(USheetImportPopup, { workbook, activeSheet, onWorkbookReplaced })
    }
  })
  app.mount(el)
  apps.push(app)
  return el
}

/** 触发文件选择（stub pick）并等异步链（arrayBuffer → importXlsx → danger）完成 */
async function triggerPickAndAwait(el: HTMLElement): Promise<void> {
  el.querySelector<HTMLButtonElement>('.picker-stub-btn')!.click()
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
  apps.splice(0).forEach((app) => app.unmount())
  containers.splice(0).forEach((el) => el.remove())
  vi.clearAllMocks()
  mocks.importXlsx.mockResolvedValue({ sheetCount: 2 })
})

describe('USheetImportPopup 导入确认兜底', () => {
  it('确认后：loading 提示 → replaceWorkbook → 成功提示', async () => {
    const replaced = vi.fn()
    const parsingRef = ref(false)
    const el = mountPopup(replaced, parsingRef)
    await triggerPickAndAwait(el)
    const onClosed = getOnClosed()
    await onClosed('confirm')

    // 解析期 v-loading 状态：开始 true → 完成（弹确认框前）false
    // 解析期 v-loading 状态：解析完成（弹确认框前）已复位 false（解析中 true 由浏览器端到端验证）
    expect(parsingRef.value).toBe(false)
    expect(mocks.message).toHaveBeenCalledWith(
      expect.objectContaining({ message: '正在导入…', duration: 0 })
    )
    expect(mocks.replaceWorkbook).toHaveBeenCalledTimes(1)
    expect(replaced).toHaveBeenCalledTimes(1)
    // 「导入完成」在 2 帧后（等首帧渲染完成）才报：flush 两帧
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
    expect(mocks.message.success).toHaveBeenCalledWith('导入完成')
  })

  it('replaceWorkbook 抛错：报错提示 + 不误报成功 + 不通知宿主', async () => {
    const replaced = vi.fn()
    const el = mountPopup(replaced, ref(false))
    await triggerPickAndAwait(el)
    const loadingClose = vi.fn()
    mocks.message.mockReturnValueOnce({
      close: loadingClose,
      id: 'loading',
      onClosed: Promise.resolve()
    })
    mocks.replaceWorkbook.mockImplementationOnce(() => {
      throw new Error('内存不足 boom')
    })

    const onClosed = getOnClosed()
    await onClosed('confirm')

    expect(mocks.replaceWorkbook).toHaveBeenCalledTimes(1)
    expect(replaced).not.toHaveBeenCalled()
    expect(mocks.message.error).toHaveBeenCalledWith('导入失败：内存不足 boom')
    // 失败时不出现「导入完成」
    expect(mocks.message.success).not.toHaveBeenCalled()
    // loading 必然关闭
    expect(loadingClose).toHaveBeenCalledTimes(1)
  })

  it('取消（非 confirm）：不触发导入', async () => {
    const el = mountPopup(undefined, ref(false))
    await triggerPickAndAwait(el)
    const onClosed = getOnClosed()
    await onClosed('cancel')
    expect(mocks.replaceWorkbook).not.toHaveBeenCalled()
    // 解析前的「正在解析文件…」loading 是预期反馈；取消后不应出现导入/成功/失败提示
    expect(mocks.message.success).not.toHaveBeenCalled()
    expect(mocks.message.error).not.toHaveBeenCalled()
  })
})
