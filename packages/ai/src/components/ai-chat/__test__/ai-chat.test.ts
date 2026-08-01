import { describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import type { ChatTool, ChatTransport } from '../../../chat/types'
import type { AiChatExposed } from '../../../types'
import UAiChat from '../ai-chat.vue'

// happy-dom 环境下用桩组件替换 MarkdownRender，仅验证组件自身逻辑
vi.mock('markstream-vue', () => ({
  default: defineComponent({
    props: { content: { type: String, default: '' } },
    setup(props) {
      return () => h('div', { class: 'md-stub' }, props.content)
    }
  })
}))

function mountAiChat(options: { transport: ChatTransport; tools?: ChatTool[]; welcome?: string }) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const chatRef = ref<AiChatExposed>()

  const app = createApp({
    render() {
      return h(UAiChat, {
        ref: chatRef,
        transport: options.transport,
        tools: options.tools,
        welcome: options.welcome
      })
    }
  })

  app.mount(host)

  return {
    host,
    chat: chatRef,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UAiChat', () => {
  it('空状态显示欢迎语', () => {
    const { host, unmount } = mountAiChat({ transport: () => {}, welcome: '有什么可以帮你？' })

    expect(host.querySelector('.u-ai-chat__welcome')?.textContent).toContain('有什么可以帮你？')
    unmount()
  })

  it('发送消息后渲染用户气泡与 assistant 回复', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('你好，我是助手')
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('你好')
    await nextTick()

    const userBubble = host.querySelector('.u-ai-chat__message--user .u-ai-chat__message-bubble')
    expect(userBubble?.textContent).toContain('你好')

    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('你好，我是助手')
    })
    unmount()
  })

  it('工具调用渲染工具卡片，可展开查看结果', async () => {
    let round = 0
    const transport: ChatTransport = (_req, handlers) => {
      round++
      if (round === 1) {
        handlers.onToolCall?.({ id: 'c1', name: 'calculate', arguments: '{"expression":"1+1"}' })
      } else {
        handlers.onTextDelta('算好了')
      }
    }
    const tools: ChatTool[] = [
      { name: 'calculate', description: '计算', parameters: {}, execute: () => ({ value: 2 }) }
    ]
    const { host, chat, unmount } = mountAiChat({ transport, tools })

    chat.value?.send('1+1 等于几')

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__tool-call-name')?.textContent).toBe('calculate')
    })

    // 执行完成后自动折叠，点击头部展开
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__tool-call.is-success')).toBeTruthy()
    })

    const header = host.querySelector<HTMLElement>('.u-ai-chat__tool-call-header')!
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()

    const body = host.querySelector('.u-ai-chat__tool-call-body')
    expect(body?.textContent).toContain('"expression": "1+1"')
    expect(body?.textContent).toContain('"value": 2')
    unmount()
  })

  it('needsConfirm 工具渲染确认按钮，点击允许后执行', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onToolCall?.({ id: 'c1', name: 'deleteFile', arguments: '{"path":"/tmp/a"}' })
    }
    const execute = vi.fn()
    const tools: ChatTool[] = [
      { name: 'deleteFile', description: '删除文件', parameters: {}, needsConfirm: true, execute }
    ]
    const { host, chat, unmount } = mountAiChat({ transport, tools })

    chat.value?.send('删掉 /tmp/a')

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__tool-call-confirm')).toBeTruthy()
    })
    expect(execute).not.toHaveBeenCalled()

    const allowBtn = [
      ...host.querySelectorAll<HTMLElement>('.u-ai-chat__tool-call-confirm button')
    ].find((btn) => btn.textContent?.includes('允许'))!
    allowBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    await vi.waitFor(() => {
      expect(execute).toHaveBeenCalled()
    })
    unmount()
  })

  it('生成中输入区显示停止按钮', async () => {
    const transport: ChatTransport = (req) => {
      return new Promise<void>((resolve) => {
        req.signal.addEventListener('abort', () => resolve(), { once: true })
      })
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('hi')
    await nextTick()

    expect(host.querySelector('.u-ai-chat__input-stop')).toBeTruthy()

    chat.value?.abort()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__input-stop')).toBeFalsy()
    })
    unmount()
  })
})
