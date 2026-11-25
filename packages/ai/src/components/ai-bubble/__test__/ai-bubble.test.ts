// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, defineComponent, h, nextTick } from 'vue'

import { UAiBubble } from '..'
import type { ChatMessage } from '../../../chat/types'
import type { AiBubbleProps } from '../../../types'

vi.mock('markstream-vue', () => ({
  default: defineComponent({
    props: { content: { type: String, default: '' }, customFlag: { type: String, default: '' } },
    setup(props) {
      return () =>
        h('div', { class: 'md-stub', 'data-custom': props.customFlag || undefined }, props.content)
    }
  })
}))

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
  vi.unstubAllGlobals()
})

function mountBubble(
  props: AiBubbleProps & Record<string, unknown>,
  slots?: Record<string, (scope: any) => any>
) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(UAiBubble, props, slots) })
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UAiBubble', () => {
  it('用户消息复用 UAiAttachments，点击图片派发 preview-image', () => {
    const onPreviewImage = vi.fn()
    const userMsg: ChatMessage = {
      id: 'u1',
      role: 'user',
      content: '帮我看下这张图',
      attachments: [
        {
          name: 'screen.png',
          mimeType: 'image/png',
          size: 100,
          dataUrl: 'data:image/png;base64,BBB'
        },
        { name: 'log.txt', mimeType: 'text/plain', size: 20, dataUrl: '' }
      ]
    }
    const { host, unmount } = mountBubble({ message: userMsg, onPreviewImage })

    expect(host.querySelector('.u-ai-bubble--user')).toBeTruthy()
    expect(host.querySelector('.u-ai-bubble__text')?.textContent).toBe('帮我看下这张图')
    expect(host.querySelector('.u-ai-bubble__attachments.u-ai-attachments--default')).toBeTruthy()
    expect(host.querySelectorAll('.u-ai-attachments__item')).toHaveLength(2)

    host.querySelector<HTMLElement>('.u-ai-bubble__attachments .u-ai-attachments__image')!.click()
    expect(onPreviewImage).toHaveBeenCalledWith('data:image/png;base64,BBB', 'screen.png')
    unmount()
  })

  it('assistant 消息渲染 MarkdownRender、状态行及自定义 #default / #actions 插槽', () => {
    const errMsg: ChatMessage = {
      id: 'a1',
      role: 'assistant',
      content: '部分输出',
      status: 'error'
    }
    const m1 = mountBubble({ message: errMsg, isLast: true, rendererProps: { customFlag: 'yes' } })
    expect(m1.host.querySelector('.md-stub')?.textContent).toBe('部分输出')
    expect(m1.host.querySelector('.md-stub')?.getAttribute('data-custom')).toBe('yes')
    expect(m1.host.querySelector('.u-ai-bubble__status')?.textContent).toBe('生成出错')
    m1.unmount()

    const abortedMsg: ChatMessage = { id: 'a2', role: 'assistant', content: '', status: 'aborted' }
    const m2 = mountBubble({ message: abortedMsg, isLast: true })
    expect(m2.host.querySelector('.u-ai-bubble__status')?.textContent).toBe('已停止生成')
    m2.unmount()

    const customMsg: ChatMessage = {
      id: 'a3',
      role: 'assistant',
      content: '原始文本',
      status: 'streaming'
    }
    const m3 = mountBubble(
      { message: customMsg, showActions: true, duration: 3000 },
      {
        default: (scope) =>
          h(
            'div',
            { class: 'custom-body' },
            `${scope.content}|streaming:${String(scope.streaming)}`
          ),
        actions: (scope) =>
          h(
            'div',
            { class: 'custom-actions' },
            `dur:${scope.duration}|copy:${String(scope.canCopy)}`
          )
      }
    )
    expect(m3.host.querySelector('.md-stub')).toBeFalsy()
    expect(m3.host.querySelector('.custom-body')?.textContent).toBe('原始文本|streaming:true')
    expect(m3.host.querySelector('.custom-actions')?.textContent).toBe('dur:3000|copy:true')
    m3.unmount()
  })

  it('showActions 与 showRegenerate 控制操作区显示逻辑', () => {
    const doneMsg: ChatMessage = { id: 'a1', role: 'assistant', content: '完成', status: 'done' }

    // 默认非最后一条不显示操作区
    const nonLast = mountBubble({ message: doneMsg, isLast: false })
    expect(nonLast.host.querySelector('.u-ai-bubble__actions')).toBeFalsy()
    nonLast.unmount()

    // 强制 showActions: true 即使非最后一条也显示
    const forcedShow = mountBubble({ message: doneMsg, isLast: false, showActions: true })
    expect(forcedShow.host.querySelector('.u-ai-bubble__actions')).toBeTruthy()
    forcedShow.unmount()

    // 强制 showActions: false 即使最后一条也隐藏
    const forcedHide = mountBubble({ message: doneMsg, isLast: true, showActions: false })
    expect(forcedHide.host.querySelector('.u-ai-bubble__actions')).toBeFalsy()
    forcedHide.unmount()

    // showRegenerate: false 隐藏重新生成按钮
    const noRegen = mountBubble({
      message: doneMsg,
      isLast: true,
      showRegenerate: false,
      duration: 2500
    })
    expect(noRegen.host.querySelector('.u-ai-bubble__duration')?.textContent?.trim()).toBe(
      '用时 3s'
    )
    expect(noRegen.host.querySelector('[title="复制"]')).toBeTruthy()
    expect(noRegen.host.querySelector('[title="重新生成"]')).toBeFalsy()
    noRegen.unmount()
  })

  it('点击复制写入剪贴板并触发 copy，点击重新生成触发 regenerate', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

    const onCopy = vi.fn()
    const onRegenerate = vi.fn()
    const msg: ChatMessage = {
      id: 'a1',
      role: 'assistant',
      content: '  待复制文本  ',
      status: 'done'
    }
    const { host, unmount } = mountBubble({ message: msg, isLast: true, onCopy, onRegenerate })

    const copyBtn = host.querySelector<HTMLElement>('[title="复制"]')!
    copyBtn.click()
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('待复制文本')
      expect(onCopy).toHaveBeenCalledWith('待复制文本')
    })
    await nextTick()
    expect(copyBtn.getAttribute('title')).toBe('已复制')

    host.querySelector<HTMLElement>('[title="重新生成"]')!.click()
    expect(onRegenerate).toHaveBeenCalledTimes(1)
    unmount()
  })
})
