// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, ref } from 'vue'

import { UAiComposer } from '..'
import type { ChatAttachment } from '../../../chat/types'
import type { AiComposerExposed, AiComposerProps } from '../../../types'

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

function mountComposer(
  props: AiComposerProps & Record<string, unknown> = {},
  slots?: Record<string, (scope: any) => any>
) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const composerRef = ref<AiComposerExposed>()

  const app = createApp({
    render() {
      return h(UAiComposer, { ref: composerRef, ...props }, slots)
    }
  })
  app.mount(host)

  return {
    host,
    composer: composerRef,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

const sampleAttachments: ChatAttachment[] = [
  { name: 'pic.png', mimeType: 'image/png', size: 120, dataUrl: 'data:image/png;base64,AAA' },
  { name: 'readme.md', mimeType: 'text/markdown', size: 64, dataUrl: '', textContent: '# hi' }
]

describe('UAiComposer', () => {
  it('无 DI 独立挂载无 Vue warning，且默认无清除按钮、上下文拾取器、模型选择器与用量环', () => {
    const { host, unmount } = mountComposer()

    expect(host.querySelector('.u-ai-composer')).toBeTruthy()
    expect(host.querySelector('textarea.u-ai-composer__input')).toBeTruthy()
    expect(host.querySelector('.u-ai-chat__clear')).toBeFalsy()
    expect(host.querySelector('.u-ai-context-picker')).toBeFalsy()
    expect(host.querySelector('.u-ai-model-picker')).toBeFalsy()
    expect(host.querySelector('.u-ai-context-usage')).toBeFalsy()

    const vueWarnings = warnSpy.mock.calls.filter((args) =>
      args.some((arg) => typeof arg === 'string' && arg.includes('[Vue warn]'))
    )
    expect(vueWarnings).toEqual([])
    unmount()
  })

  it('支持自定义 #header、#attachments、#toolbar-left、#toolbar-right 与 #action 插槽', async () => {
    const onSend = vi.fn()
    const onAbort = vi.fn()
    const { host, unmount } = mountComposer(
      { modelValue: '草稿', attachments: [...sampleAttachments], onSend, onAbort },
      {
        header: () => h('div', { class: 'custom-header' }, '头部提示'),
        attachments: (scope) =>
          h(
            'div',
            { class: 'custom-attachments' },
            scope.attachments.map((att: ChatAttachment, idx: number) =>
              h(
                'button',
                { type: 'button', class: `custom-att-${idx}`, onClick: () => scope.remove(idx) },
                att.name
              )
            )
          ),
        'toolbar-left': (scope) =>
          h(
            'button',
            {
              type: 'button',
              class: 'custom-left',
              onClick: () =>
                scope.addAttachments([
                  { name: 'extra.txt', mimeType: 'text/plain', size: 10, dataUrl: '' }
                ])
            },
            `left:${String(scope.disabled)}`
          ),
        'toolbar-right': (scope) =>
          h('span', { class: 'custom-right' }, `right:${String(scope.disabled)}`),
        action: (scope) =>
          h(
            'button',
            { type: 'button', class: 'custom-action', onClick: scope.send },
            `send:${String(scope.hasContent)}`
          )
      }
    )

    expect(host.querySelector('.custom-header')?.textContent).toBe('头部提示')
    expect(host.querySelector('.custom-attachments')).toBeTruthy()
    expect(host.querySelector('.u-ai-composer__attachments')).toBeFalsy()
    expect(host.querySelector('.custom-left')?.textContent).toBe('left:false')
    expect(host.querySelector('.custom-right')?.textContent).toBe('right:false')
    expect(host.querySelector('.custom-action')?.textContent).toBe('send:true')

    host.querySelector<HTMLElement>('.custom-action')!.click()
    await nextTick()
    expect(onSend).toHaveBeenCalledWith('草稿', sampleAttachments)
    unmount()
  })

  it('支持自定义 #toolbar 整体替换默认工具栏并传入完整作用域', async () => {
    const onSend = vi.fn()
    const onAbort = vi.fn()
    const { host, unmount } = mountComposer(
      { modelValue: 'hello', running: true, onSend, onAbort },
      {
        toolbar: (scope) =>
          h('div', { class: 'custom-toolbar' }, [
            h(
              'button',
              { type: 'button', class: 'tb-send', onClick: scope.send },
              `has:${String(scope.hasContent)}|stop:${String(scope.showStop)}`
            ),
            h('button', { type: 'button', class: 'tb-abort', onClick: scope.abort }, '中止')
          ])
      }
    )

    expect(host.querySelector('.u-ai-composer__toolbar-left')).toBeFalsy()
    expect(host.querySelector('.u-ai-composer__toolbar-right')).toBeFalsy()
    expect(host.querySelector('.tb-send')?.textContent).toBe('has:true|stop:false')

    host.querySelector<HTMLElement>('.tb-abort')!.click()
    expect(onAbort).toHaveBeenCalledTimes(1)
    host.querySelector<HTMLElement>('.tb-send')!.click()
    expect(onSend).toHaveBeenCalledWith('hello', [])
    unmount()
  })

  it('非受控与受控 v-model / v-model:attachments 均可正常读写与清空', async () => {
    // 非受控模式
    const uncontrolledSend = vi.fn()
    const u = mountComposer({ onSend: uncontrolledSend })
    const textarea = u.host.querySelector<HTMLTextAreaElement>('textarea.u-ai-composer__input')!
    textarea.value = '非受控消息'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    u.composer.value?.addAttachments([sampleAttachments[1]!])
    await nextTick()

    expect(u.composer.value?.getContent()).toBe('非受控消息')
    expect(u.host.querySelectorAll('.u-ai-attachments__item')).toHaveLength(1)

    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    )
    await nextTick()
    expect(uncontrolledSend).toHaveBeenCalledWith('非受控消息', [sampleAttachments[1]])
    expect(textarea.value).toBe('')
    expect(u.host.querySelectorAll('.u-ai-attachments__item')).toHaveLength(0)
    u.unmount()

    // 受控模式
    const text = ref('初始内容')
    const atts = ref<ChatAttachment[]>([...sampleAttachments])
    const controlledSend = vi.fn()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render() {
        return h(UAiComposer, {
          modelValue: text.value,
          attachments: atts.value,
          'onUpdate:modelValue': (v: string) => {
            text.value = v
          },
          'onUpdate:attachments': (v: ChatAttachment[]) => {
            atts.value = v
          },
          onSend: controlledSend
        })
      }
    })
    app.mount(host)
    await nextTick()

    const cTextarea = host.querySelector<HTMLTextAreaElement>('textarea.u-ai-composer__input')!
    expect(cTextarea.value).toBe('初始内容')
    expect(host.querySelectorAll('.u-ai-attachments__item')).toHaveLength(2)

    // 移除首项附件
    host.querySelector<HTMLElement>('.u-ai-attachments__remove')!.click()
    await nextTick()
    expect(atts.value).toHaveLength(1)

    cTextarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    )
    await nextTick()
    expect(controlledSend).toHaveBeenCalledWith('初始内容', [sampleAttachments[1]])
    expect(text.value).toBe('')
    expect(atts.value).toEqual([])

    app.unmount()
    host.remove()
  })

  it('allowPasteImage 控制粘贴图片是否提取为附件', async () => {
    const createPasteEvent = (file: File) => {
      const evt = new Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(evt, 'clipboardData', {
        value: {
          items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
          files: [],
          getData: () => ''
        }
      })
      return evt
    }
    const imgFile = new File([new Uint8Array([137, 80, 78, 71])], 'paste.png', {
      type: 'image/png'
    })

    // 允许粘贴图片（默认 true）
    const enabled = mountComposer()
    const t1 = enabled.host.querySelector<HTMLTextAreaElement>('textarea.u-ai-composer__input')!
    const paste1 = createPasteEvent(imgFile)
    t1.dispatchEvent(paste1)
    expect(paste1.defaultPrevented).toBe(true)
    await vi.waitFor(() => {
      expect(enabled.host.querySelectorAll('.u-ai-attachments__item.is-image')).toHaveLength(1)
    })
    enabled.unmount()

    // 禁用粘贴图片
    const disabled = mountComposer({ allowPasteImage: false })
    const t2 = disabled.host.querySelector<HTMLTextAreaElement>('textarea.u-ai-composer__input')!
    const paste2 = createPasteEvent(imgFile)
    t2.dispatchEvent(paste2)
    await nextTick()
    expect(paste2.defaultPrevented).toBe(false)
    expect(disabled.host.querySelectorAll('.u-ai-attachments__item')).toHaveLength(0)
    disabled.unmount()
  })

  it('IME 组合态（isComposing / keyCode 229）回车不发送，Shift+Enter 不发送', async () => {
    const onSend = vi.fn()
    const { host, unmount } = mountComposer({ onSend })
    const textarea = host.querySelector<HTMLTextAreaElement>('textarea.u-ai-composer__input')!

    textarea.value = '输入中'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    const composingEvt = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true
    })
    Object.defineProperty(composingEvt, 'isComposing', { value: true })
    textarea.dispatchEvent(composingEvt)
    await nextTick()
    expect(onSend).not.toHaveBeenCalled()
    expect(composingEvt.defaultPrevented).toBe(false)

    const phantomEvt = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true
    })
    Object.defineProperty(phantomEvt, 'keyCode', { value: 229 })
    textarea.dispatchEvent(phantomEvt)
    await nextTick()
    expect(onSend).not.toHaveBeenCalled()

    const shiftEnter = new KeyboardEvent('keydown', {
      key: 'Enter',
      shiftKey: true,
      bubbles: true,
      cancelable: true
    })
    textarea.dispatchEvent(shiftEnter)
    await nextTick()
    expect(onSend).not.toHaveBeenCalled()

    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    )
    await nextTick()
    expect(onSend).toHaveBeenCalledWith('输入中', [])
    unmount()
  })

  it('disabled 与 running 状态控制：禁用态阻断交互，运行中空输入停止、有内容入队', async () => {
    const onSend = vi.fn()
    const onAbort = vi.fn()

    // running 状态
    const runningMount = mountComposer({ running: true, onSend, onAbort })
    const stopBtn = runningMount.host.querySelector<HTMLElement>('.u-ai-composer__stop')
    expect(stopBtn).toBeTruthy()
    stopBtn!.closest('button')!.click()
    expect(onAbort).toHaveBeenCalledTimes(1)

    const rTextarea = runningMount.host.querySelector<HTMLTextAreaElement>(
      'textarea.u-ai-composer__input'
    )!
    rTextarea.value = '排队任务'
    rTextarea.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    expect(runningMount.host.querySelector('.u-ai-composer__stop')).toBeFalsy()
    const sendBtn = runningMount.host.querySelector<HTMLButtonElement>(
      '.u-ai-composer__toolbar-right > .u-button'
    )!
    expect(sendBtn.title).toBe('加入待发送队列')
    sendBtn.click()
    await nextTick()
    expect(onSend).toHaveBeenCalledWith('排队任务', [])
    runningMount.unmount()

    // disabled 状态
    onSend.mockClear()
    onAbort.mockClear()
    const disabledMount = mountComposer({
      disabled: true,
      modelValue: '不可发送',
      attachments: [...sampleAttachments],
      onSend,
      onAbort
    })
    expect(disabledMount.host.querySelector('.u-ai-composer.is-disabled')).toBeTruthy()
    const dTextarea = disabledMount.host.querySelector<HTMLTextAreaElement>(
      'textarea.u-ai-composer__input'
    )!
    expect(dTextarea.disabled).toBe(true)
    expect(disabledMount.host.querySelector('.u-ai-attachments__remove')).toBeFalsy()
    dTextarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    )
    expect(onSend).not.toHaveBeenCalled()
    disabledMount.unmount()
  })

  it('expose 方法：setContent / getContent / focus / addAttachments / addFiles', async () => {
    const { host, composer, unmount } = mountComposer({ maxAttachmentSize: 50 })
    const textarea = host.querySelector<HTMLTextAreaElement>('textarea.u-ai-composer__input')!

    composer.value?.setContent('通过 expose 设置')
    await nextTick()
    expect(composer.value?.getContent()).toBe('通过 expose 设置')
    expect(textarea.value).toBe('通过 expose 设置')

    textarea.blur()
    composer.value?.focus()
    expect(document.activeElement).toBe(textarea)

    composer.value?.addAttachments([sampleAttachments[0]!])
    await nextTick()
    expect(host.querySelectorAll('.u-ai-attachments__item')).toHaveLength(1)

    const smallFile = new File(['hello'], 'small.txt', { type: 'text/plain' })
    const largeFile = new File(['x'.repeat(100)], 'large.txt', { type: 'text/plain' })
    await composer.value?.addFiles([smallFile, largeFile])
    await nextTick()

    const names = [...host.querySelectorAll('.u-ai-attachments__name')].map((el) => el.textContent)
    expect(names).toEqual(['small.txt'])
    unmount()
  })

  it('点击图片附件派发 preview-image 事件', async () => {
    const onPreviewImage = vi.fn()
    const { host, unmount } = mountComposer({
      attachments: [sampleAttachments[0]!],
      onPreviewImage
    })

    host.querySelector<HTMLElement>('.u-ai-attachments__image')!.click()
    await nextTick()
    expect(onPreviewImage).toHaveBeenCalledWith(sampleAttachments[0]!.dataUrl, 'pic.png')
    unmount()
  })
})
