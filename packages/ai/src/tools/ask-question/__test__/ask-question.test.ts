import { describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import type { ChatMessage, ChatTransport } from '../../../chat/types'
import UAiChat from '../../../components/ai-chat/ai-chat.vue'
import type { AiChatExposed } from '../../../types'

// happy-dom 环境下用桩组件替换 MarkdownRender，仅验证组件自身逻辑
vi.mock('markstream-vue', () => ({
  default: defineComponent({
    props: { content: { type: String, default: '' } },
    setup(props) {
      return () => h('div', { class: 'md-stub' }, props.content)
    }
  })
}))

function mountAiChat(transport: ChatTransport) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const chatRef = ref<AiChatExposed>()

  const app = createApp({
    render() {
      // 不传 tools：验证提问工具由 UAiChat 内置自动注入
      return h(UAiChat, { ref: chatRef, transport })
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

const QUESTIONS = [
  { question: '目标用户是谁？', options: ['开发者', '设计师'] },
  { question: '偏好什么风格？', options: ['简洁', '炫酷'] },
  { question: '还有什么补充？', placeholder: '例如：需要深色模式' }
]

/** 第一轮发起提问工具调用、第二轮输出文本的 transport；rounds 记录每轮收到的消息 */
function createAskTransport(rounds: ChatMessage[][]) {
  let round = 0
  const transport: ChatTransport = (req, handlers) => {
    round++
    rounds.push(req.messages)
    if (round === 1) {
      handlers.onToolCall?.({
        id: 'q1',
        name: 'askQuestion',
        arguments: JSON.stringify({ questions: QUESTIONS })
      })
    } else {
      handlers.onTextDelta('明白了')
    }
  }
  return transport
}

const click = (el: HTMLElement) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))

/** 底部导航按钮（UButton disabled 体现为 is-disabled class） */
const actionButton = (host: HTMLElement, text: string) => {
  return [...host.querySelectorAll<HTMLElement>('.u-ai-chat__ask-question-actions button')].find(
    (btn) => btn.textContent?.includes(text)
  )
}

/** 当前题的选项按钮 */
const optionButton = (host: HTMLElement, text: string) => {
  return [...host.querySelectorAll<HTMLElement>('.u-ai-chat__ask-question-opt')].find((el) =>
    el.textContent?.includes(text)
  )
}

describe('内置提问工具', () => {
  it('分页提问：导航、作答、提交后展示问答摘要', async () => {
    const rounds: ChatMessage[][] = []
    const { host, chat, unmount } = mountAiChat(createAskTransport(rounds))

    chat.value?.send('帮我做个页面')

    // 第 1 题：进度、选项、「上一个」禁用、无「提交」
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__ask-question-q')?.textContent).toContain(
        '目标用户是谁？'
      )
    })
    expect(host.querySelector('.u-ai-chat__ask-question-count')?.textContent).toBe('1 / 3')
    expect(actionButton(host, '上一个')?.className).toContain('is-disabled')
    expect(actionButton(host, '下一个')).toBeTruthy()
    expect(actionButton(host, '提交')).toBeUndefined()

    // 点选「开发者」
    click(optionButton(host, '开发者')!)
    await nextTick()
    expect(optionButton(host, '开发者')?.className).toContain('is-selected')

    // 下一个 → 第 2 题，点选「简洁」
    click(actionButton(host, '下一个')!)
    await nextTick()
    expect(host.querySelector('.u-ai-chat__ask-question-q')?.textContent).toContain(
      '偏好什么风格？'
    )
    click(optionButton(host, '简洁')!)
    await nextTick()

    // 下一个 → 第 3 题（纯文本），「下一个」变为「提交」，未作答时禁用
    click(actionButton(host, '下一个')!)
    await nextTick()
    expect(host.querySelector('.u-ai-chat__ask-question-q')?.textContent).toContain(
      '还有什么补充？'
    )
    expect(actionButton(host, '下一个')).toBeUndefined()
    expect(actionButton(host, '提交')?.className).toContain('is-disabled')

    // 自定义输入作答后「提交」可用
    const input = host.querySelector<HTMLInputElement>('.u-ai-chat__ask-question input')!
    input.value = '需要深色模式'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(actionButton(host, '提交')?.className).not.toContain('is-disabled')

    // 「上一个」返回第 1 题，选中态保留
    click(actionButton(host, '上一个')!)
    await nextTick()
    click(actionButton(host, '上一个')!)
    await nextTick()
    expect(host.querySelector('.u-ai-chat__ask-question-q')?.textContent).toContain(
      '目标用户是谁？'
    )
    expect(optionButton(host, '开发者')?.className).toContain('is-selected')

    // 回到最后提交
    click(actionButton(host, '下一个')!)
    await nextTick()
    click(actionButton(host, '下一个')!)
    await nextTick()
    click(actionButton(host, '提交')!)

    // 第二轮 transport 收到含回答的 tool 消息
    await vi.waitFor(() => {
      expect(rounds.length).toBe(2)
    })
    const toolMessage = rounds[1]![rounds[1]!.length - 1]!
    expect(toolMessage.role).toBe('tool')
    expect(JSON.parse(toolMessage.content)).toEqual({
      answers: [
        { question: '目标用户是谁？', answer: '开发者' },
        { question: '偏好什么风格？', answer: '简洁' },
        { question: '还有什么补充？', answer: '需要深色模式' }
      ]
    })

    // 问答摘要视图：命中选项的回答渲染为 chip，完成后保持展开
    await vi.waitFor(() => {
      expect(host.querySelectorAll('.u-ai-chat__ask-question-result').length).toBe(3)
    })
    const summary = host.querySelector('.u-ai-chat__ask-question')!.textContent!
    expect(summary).toContain('目标用户是谁？')
    expect(summary).toContain('需要深色模式')
    expect(host.querySelector('.u-ai-chat__ask-question-chip')?.textContent).toBe('开发者')
    expect(host.querySelector('.u-ai-chat__tool-call.is-success.is-active')).toBeTruthy()
    unmount()
  })

  it('作答中停止生成，显示已取消', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onToolCall?.({
        id: 'q1',
        name: 'askQuestion',
        arguments: JSON.stringify({ questions: [{ question: 'Q？' }] })
      })
    }
    const { host, chat, unmount } = mountAiChat(transport)

    chat.value?.send('提个问')

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__ask-question')).toBeTruthy()
    })

    chat.value?.abort()

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__ask-question-status')?.textContent).toBe('已取消')
    })
    unmount()
  })
})
