// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import { UAiContextPicker } from '..'
import type {
  AiContextPickerExposed,
  AiContextPickerItem,
  AiContextPickerProps
} from '../../../types'

let warnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  const injectionWarnings = warnSpy.mock.calls.filter((args) =>
    args.some(
      (arg) => typeof arg === 'string' && (arg.includes('injection') || arg.includes('AiChatDIKey'))
    )
  )
  expect(injectionWarnings).toEqual([])
  warnSpy.mockRestore()
})

function mountPicker(
  props: AiContextPickerProps & Record<string, unknown> = {},
  slots?: Record<string, (scope: any) => any>
) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const pickerRef = ref<AiContextPickerExposed>()

  const app = createApp({
    render() {
      return h(UAiContextPicker, { ref: pickerRef, ...props }, slots)
    }
  })
  app.mount(host)

  return {
    host,
    picker: pickerRef,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UAiContextPicker', () => {
  it('无 DI 独立挂载无 Vue warning，点击触发器展开附件上传面板', async () => {
    const { host, unmount } = mountPicker({ uploadLabel: '选择文件' })
    const trigger = host.querySelector<HTMLElement>('.u-ai-context-picker__trigger')!
    expect(trigger).toBeTruthy()

    trigger.click()
    await vi.waitFor(() => {
      expect(document.body.querySelector('.u-ai-context-picker__panel')).toBeTruthy()
    })

    const panel = document.body.querySelector('.u-ai-context-picker__panel')!
    expect(panel.textContent).toContain('选择文件')
    expect(panel.querySelector('.u-file-picker input[type="file"]')).toBeTruthy()

    const vueWarnings = warnSpy.mock.calls.filter((args) =>
      args.some((arg) => typeof arg === 'string' && arg.includes('[Vue warn]'))
    )
    expect(vueWarnings).toEqual([])
    unmount()
  })

  it('上传附件派发 pick-files 与 add-attachments，并按 maxAttachmentSize 过滤超限文件', async () => {
    const onPickFiles = vi.fn()
    const onAddAttachments = vi.fn()
    const { host, unmount } = mountPicker({ maxAttachmentSize: 20, onPickFiles, onAddAttachments })

    host.querySelector<HTMLElement>('.u-ai-context-picker__trigger')!.click()
    await vi.waitFor(() => {
      expect(document.body.querySelector('.u-ai-context-picker__panel')).toBeTruthy()
    })

    const input = document.body.querySelector<HTMLInputElement>(
      '.u-ai-context-picker__panel .u-file-picker input[type="file"]'
    )!
    const okFile = new File(['hello'], 'ok.txt', { type: 'text/plain' })
    const tooLargeFile = new File(['x'.repeat(50)], 'big.txt', { type: 'text/plain' })

    Object.defineProperty(input, 'files', { value: [okFile, tooLargeFile], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    expect(onPickFiles).toHaveBeenCalledTimes(1)
    expect(onPickFiles.mock.calls[0]?.[0]).toHaveLength(2)

    await vi.waitFor(() => {
      expect(onAddAttachments).toHaveBeenCalledTimes(1)
    })
    const attachments = onAddAttachments.mock.calls[0]?.[0]
    expect(attachments).toHaveLength(1)
    expect(attachments[0]?.name).toBe('ok.txt')
    expect(attachments[0]?.textContent).toBe('hello')
    unmount()
  })

  it('支持自定义 items、禁用项拦截及 select 事件', async () => {
    const CustomIcon = defineComponent({
      setup: () => () => h('svg', { class: 'custom-ctx-icon' })
    })
    const items: AiContextPickerItem[] = [
      { key: 'doc', label: '知识库', description: '关联团队文档', icon: CustomIcon },
      { key: 'locked', label: '受限资源', disabled: true }
    ]
    const onSelect = vi.fn()
    const { host, unmount } = mountPicker({ upload: false, items, onSelect })

    host.querySelector<HTMLElement>('.u-ai-context-picker__trigger')!.click()
    await vi.waitFor(() => {
      expect(document.body.querySelector('.u-ai-context-picker__panel')).toBeTruthy()
    })

    const panel = document.body.querySelector('.u-ai-context-picker__panel')!
    expect(panel.querySelector('.u-file-picker')).toBeFalsy()
    expect(panel.querySelector('.custom-ctx-icon')).toBeTruthy()
    expect(panel.querySelector('.u-ai-context-picker__option-desc')?.textContent).toBe(
      '关联团队文档'
    )

    const options = [...panel.querySelectorAll<HTMLElement>('.u-ai-context-picker__option')]
    expect(options[1]?.classList.contains('is-disabled')).toBe(true)

    // 点击禁用项不触发 select 且面板保持打开
    options[1]!.click()
    await nextTick()
    expect(onSelect).not.toHaveBeenCalled()
    expect(document.body.querySelector('.u-ai-context-picker__panel')).toBeTruthy()

    // 点击可用项触发 select 并关闭面板
    options[0]!.click()
    await nextTick()
    expect(onSelect).toHaveBeenCalledWith(items[0])
    unmount()
  })

  it('支持 #trigger、#prepend、#default 插槽与 close() expose', async () => {
    const { host, picker, unmount } = mountPicker(
      { upload: false },
      {
        trigger: () => h('button', { type: 'button', class: 'my-trigger' }, '自定义按钮'),
        prepend: (scope) =>
          h('button', { type: 'button', class: 'slot-prepend', onClick: scope.close }, '前置项'),
        default: (scope) =>
          h('button', { type: 'button', class: 'slot-default', onClick: scope.close }, '后置项')
      }
    )

    expect(host.querySelector('.u-ai-context-picker__trigger')).toBeFalsy()
    const myTrigger = host.querySelector<HTMLElement>('.my-trigger')!
    expect(myTrigger).toBeTruthy()

    myTrigger.click()
    await vi.waitFor(() => {
      expect(document.body.querySelector('.slot-prepend')).toBeTruthy()
      expect(document.body.querySelector('.slot-default')).toBeTruthy()
    })

    picker.value?.close()
    await vi.waitFor(() => {
      expect(document.body.querySelector('.slot-prepend')).toBeFalsy()
    })
    unmount()
  })
})
