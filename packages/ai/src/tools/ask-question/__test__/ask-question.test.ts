// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vite-plus/test'
import { createApp, defineComponent, h, nextTick, ref } from 'vue'

import type { ChatMessage, ChatTransport } from '../../../chat/types'
import { summarizeArguments } from '../../../components/_shared/tool-format'
import UAiChat from '../../../components/ai-chat/ai-chat.vue'
import type { AiChatExposed } from '../../../types'
import type { AskQuestionItem } from '../ask-question'

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

const QUESTIONS: AskQuestionItem[] = [
  { question: '目标用户是谁？', options: ['开发者', '设计师'] },
  { question: '偏好什么风格？', options: ['简洁', '炫酷'] },
  { question: '还有什么补充？', placeholder: '例如：需要深色模式' }
]

function createAskTransport(rounds: ChatMessage[][], questions: AskQuestionItem[] = QUESTIONS) {
  let round = 0
  const transport: ChatTransport = (req, handlers) => {
    round++
    rounds.push(req.messages)
    if (round === 1) {
      handlers.onToolCall?.({
        id: 'q1',
        name: 'askQuestion',
        arguments: JSON.stringify({ questions })
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
  return [...host.querySelectorAll<HTMLElement>('.u-ai-question-card__actions button')].find(
    (btn) => btn.textContent?.includes(text)
  )
}

const optionButton = (host: HTMLElement, text: string) => {
  return [...host.querySelectorAll<HTMLElement>('.u-ai-question-card__opt')].find((el) =>
    el.textContent?.includes(text)
  )
}

describe('内置提问工具', () => {
  it('分页提问：外层回复流渲染、单选序号 1/2/3、提交后常驻展示问答摘要不折叠', async () => {
    const rounds: ChatMessage[][] = []
    const { host, chat, unmount } = mountAiChat(createAskTransport(rounds))

    chat.value?.send('帮我做个页面')

    await vi.waitFor(() => {
      expect(
        host.querySelector('.u-ai-message-list__reply-tool .u-ai-question-card__q')?.textContent
      ).toContain('目标用户是谁？')
    })
    expect(host.querySelector('.u-ai-step-group')).toBeFalsy()
    expect(host.querySelector('.u-ai-question-card__count')?.textContent).toBe('1 / 3')
    expect(actionButton(host, '上一个')?.className).toContain('is-disabled')
    expect(actionButton(host, '下一个')).toBeTruthy()
    expect(actionButton(host, '提交')).toBeUndefined()

    // 单选选项使用 1、2 序号徽标（自定义输入行接续为 3）
    const nums = [...host.querySelectorAll('.u-ai-question-card__num')].map((el) =>
      el.textContent?.trim()
    )
    expect(nums).toEqual(['1', '2', '3'])

    click(optionButton(host, '开发者')!)
    await nextTick()
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('偏好什么风格？')

    click(optionButton(host, '简洁')!)
    await nextTick()
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('还有什么补充？')
    expect(actionButton(host, '下一个')).toBeUndefined()
    expect(actionButton(host, '提交')?.className).toContain('is-disabled')

    // 自定义输入不会自动跳转，输入作答后「提交」可用
    const input = host.querySelector<HTMLInputElement>('.u-ai-question-card__input')!
    input.value = '需要深色模式'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('还有什么补充？')
    expect(actionButton(host, '提交')?.className).not.toContain('is-disabled')

    click(actionButton(host, '上一个')!)
    await nextTick()
    click(actionButton(host, '上一个')!)
    await nextTick()
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('目标用户是谁？')
    expect(optionButton(host, '开发者')?.className).toContain('is-selected')

    click(actionButton(host, '下一个')!)
    await nextTick()
    click(actionButton(host, '下一个')!)
    await nextTick()
    click(actionButton(host, '提交')!)

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

    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('明白了')
    })
    expect(host.querySelector('.u-ai-step-group')).toBeFalsy()

    expect(
      host.querySelectorAll('.u-ai-message-list__reply-tool .u-ai-question-card__result').length
    ).toBe(3)
    const summary = host.querySelector(
      '.u-ai-message-list__reply-tool .u-ai-question-card'
    )!.textContent!
    expect(summary).toContain('目标用户是谁？')
    expect(summary).toContain('需要深色模式')
    expect(host.querySelector('.u-ai-question-card__result-a')?.textContent?.trim()).toBe('开发者')
    expect(host.querySelector('.u-ai-question-card__chip')).toBeNull()
    unmount()
  })

  it('自定义输入支持回车确认（IME 组合选词时不误触）', async () => {
    const rounds: ChatMessage[][] = []
    const twoQuestions: AskQuestionItem[] = [
      { question: '你的名字？', options: ['Alice', 'Bob'] },
      { question: '补充需求？', placeholder: '输入需求' }
    ]
    const { host, chat, unmount } = mountAiChat(createAskTransport(rounds, twoQuestions))

    chat.value?.send('开始')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('你的名字？')
    })

    const input1 = host.querySelector<HTMLInputElement>('.u-ai-question-card__input')!
    input1.value = 'Charlie'
    input1.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    // 中文输入法组合输入态按 Enter：不跳题也不提交
    input1.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true })
    )
    await nextTick()
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('你的名字？')

    input1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('补充需求？')

    // 第 2 题输入后按 Enter：直接触发提交
    const input2 = host.querySelector<HTMLInputElement>('.u-ai-question-card__input')!
    input2.value = '支持键盘快捷键'
    input2.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    input2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    await vi.waitFor(() => {
      expect(rounds.length).toBe(2)
    })
    const toolMessage = rounds[1]![rounds[1]!.length - 1]!
    expect(JSON.parse(toolMessage.content)).toEqual({
      answers: [
        { question: '你的名字？', answer: 'Charlie' },
        { question: '补充需求？', answer: '支持键盘快捷键' }
      ]
    })
    unmount()
  })

  it('支持多选、结构化选项（推荐徽标与说明）、分类标签与跳过', async () => {
    const rounds: ChatMessage[][] = []
    const richQuestions: AskQuestionItem[] = [
      {
        header: '技术栈',
        question: '选择要集成的能力（可多选）',
        multiple: true,
        options: [
          { label: 'Vue 3 (推荐)', description: '使用组合式 API' },
          { label: 'TypeScript', description: '严格类型约束' }
        ]
      },
      { header: '备注', question: '还有其他注意事项吗？', options: ['暂无'] }
    ]
    const { host, chat, unmount } = mountAiChat(createAskTransport(rounds, richQuestions))

    chat.value?.send('帮我选型')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-question-card__tag')?.textContent?.trim()).toBe('技术栈')
    })

    expect(host.querySelector('.u-ai-question-card__badge')?.textContent?.trim()).toBe('推荐')
    expect(host.querySelector('.u-ai-question-card__opt-desc')?.textContent).toContain(
      '使用组合式 API'
    )
    expect(host.querySelector('.u-ai-question-card__mode')?.textContent?.trim()).toBe('多选')
    // 多选直接复用内部 UCheckbox 组件
    expect(host.querySelectorAll('.u-ai-question-card__opt .u-checkbox').length).toBe(2)

    // 多选可同时勾选多个预设项 + 自定义输入，且勾选选项不自动跳题
    click(optionButton(host, 'Vue 3')!)
    click(optionButton(host, 'TypeScript')!)
    const input = host.querySelector<HTMLInputElement>('.u-ai-question-card__input')!
    input.value = 'Vitest'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    // 卡片级快捷键 ArrowRight 跳到第 2 题，并点击「跳过」直接提交
    const card = host.querySelector<HTMLElement>('.u-ai-question-card')!
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await nextTick()
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain(
      '还有其他注意事项吗？'
    )

    click(actionButton(host, '跳过')!)
    await vi.waitFor(() => {
      expect(rounds.length).toBe(2)
    })

    const toolMessage = rounds[1]![rounds[1]!.length - 1]!
    expect(JSON.parse(toolMessage.content)).toEqual({
      answers: [
        {
          question: '选择要集成的能力（可多选）',
          answer: 'Vue 3、TypeScript、Vitest',
          answers: ['Vue 3', 'TypeScript', 'Vitest']
        },
        { question: '还有其他注意事项吗？', answer: '', skipped: true }
      ]
    })

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-question-card__skipped')?.textContent).toBe('已跳过')
    })
    expect(host.querySelector('.u-ai-question-card__result .u-ai-question-card__tag')).toBeNull()
    expect(host.querySelector('.u-ai-question-card__result-a')?.textContent?.trim()).toBe(
      'Vue 3、TypeScript、Vitest'
    )
    unmount()
  })

  it('卡片快捷键 1-9 直接选定选项，Enter 前进', async () => {
    const rounds: ChatMessage[][] = []
    const { host, chat, unmount } = mountAiChat(
      createAskTransport(rounds, [{ question: '选一个颜色？', options: ['红色', '蓝色'] }])
    )
    chat.value?.send('挑颜色')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-question-card')).toBeTruthy()
    })

    const card = host.querySelector<HTMLElement>('.u-ai-question-card')!
    card.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true }))
    await nextTick()
    expect(optionButton(host, '蓝色')?.className).toContain('is-selected')

    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await vi.waitFor(() => {
      expect(rounds.length).toBe(2)
    })
    const toolMessage = rounds[1]![rounds[1]!.length - 1]!
    expect(JSON.parse(toolMessage.content)).toEqual({
      answers: [{ question: '选一个颜色？', answer: '蓝色' }]
    })
    unmount()
  })

  it('作答中停止生成，外层卡片直接显示已取消', async () => {
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
      expect(host.querySelector('.u-ai-message-list__reply-tool .u-ai-question-card')).toBeTruthy()
    })

    chat.value?.abort()

    // 由于 renderTo: 'reply'，中止后直接在回复流外层显示「已取消」，无需展开步骤行
    await vi.waitFor(() => {
      expect(
        host.querySelector('.u-ai-message-list__reply-tool .u-ai-question-card__status')
          ?.textContent
      ).toBe('已取消')
    })
    unmount()
  })

  it('同段包含思考过程与提问时，步骤行仅保留思考过程而不重复显示提问卡片', async () => {
    let round = 0
    const transport: ChatTransport = (_req, handlers) => {
      round++
      if (round === 1) {
        handlers.onReasoningDelta?.('先确认偏好')
        handlers.onToolCall?.({
          id: 'q1',
          name: 'askQuestion',
          arguments: JSON.stringify({ questions: [{ question: '选一个颜色？', options: ['蓝'] }] })
        })
      } else {
        handlers.onTextDelta('好的')
      }
    }
    const { host, chat, unmount } = mountAiChat(transport)

    chat.value?.send('开始')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-message-list__reply-tool .u-ai-question-card')).toBeTruthy()
    })

    expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('思考中…')

    click(optionButton(host, '蓝')!)
    await nextTick()
    click(actionButton(host, '提交')!)
    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('好的')
    })

    expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('执行了 1 个步骤')
    host.querySelector<HTMLElement>('.u-ai-step-group__bar')?.click()
    await nextTick()
    expect(host.querySelectorAll('.u-ai-step-group .u-ai-reasoning')).toHaveLength(1)
    expect(host.querySelectorAll('.u-ai-step-group .u-ai-tool-call')).toHaveLength(0)
    unmount()
  })

  it('summarizeArguments 提取提问参数的首题摘要', () => {
    expect(summarizeArguments({ questions: [{ question: '单题问题？' }] })).toBe('单题问题？')
    expect(
      summarizeArguments({
        questions: [{ question: '第一题？' }, { question: '第二题？' }, { question: '第三题？' }]
      })
    ).toBe('第一题？ 等 3 个问题')
  })
})
