// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, defineComponent, h, nextTick, ref, type PropType } from 'vue'

import { UAiMessageList } from '..'
import type { ChatMessage, ChatToolCall, ChatToolMeta } from '../../../chat/types'
import type { AiMessageListExposed, AiMessageListProps } from '../../../types'

vi.mock('markstream-vue', () => ({
  default: defineComponent({
    props: { content: { type: String, default: '' } },
    setup(props) {
      return () => h('div', { class: 'md-stub' }, props.content)
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
})

function mountList(
  props: AiMessageListProps & Record<string, unknown>,
  slots?: Record<string, (scope?: any) => any>
) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const listRef = ref<AiMessageListExposed>()
  const app = createApp({ render: () => h(UAiMessageList, { ref: listRef, ...props }, slots) })
  app.mount(host)

  return {
    host,
    list: listRef,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UAiMessageList', () => {
  it('无 DI 独立挂载无 Vue warning，正确渲染消息轮次、welcome 与 #welcome 插槽', async () => {
    const onWelcomeClick = vi.fn()
    const m1 = mountList({ messages: [], welcome: ['建议问题 A'], onWelcomeClick })
    expect(m1.host.querySelector('.u-ai-message-list__welcome-item')?.textContent).toBe(
      '建议问题 A'
    )
    m1.host.querySelector<HTMLElement>('.u-ai-message-list__welcome-item')!.click()
    expect(onWelcomeClick).toHaveBeenCalledWith('建议问题 A')
    m1.unmount()

    // 自定义 #welcome 插槽；running: true 时原位切回工作态
    const running = ref(false)
    const host2 = document.createElement('div')
    document.body.appendChild(host2)
    const app2 = createApp({
      render: () =>
        h(
          UAiMessageList,
          { messages: [], running: running.value },
          { welcome: () => h('div', { class: 'custom-welcome-slot' }, '自定义欢迎区') }
        )
    })
    app2.mount(host2)
    expect(host2.querySelector('.custom-welcome-slot')?.textContent).toBe('自定义欢迎区')

    running.value = true
    await nextTick()
    expect(host2.querySelector('.custom-welcome-slot')).toBeFalsy()
    expect(host2.querySelector('.u-ai-message-list__working')?.textContent).toContain('工作中')
    app2.unmount()
    host2.remove()

    const vueWarnings = warnSpy.mock.calls.filter((args) =>
      args.some((arg) => typeof arg === 'string' && arg.includes('[Vue warn]'))
    )
    expect(vueWarnings).toEqual([])
  })

  it('支持 showWelcome: false 与 showNavigator: false 控制显隐', async () => {
    const messages: ChatMessage[] = [
      { id: 'u1', role: 'user', content: 'Q1' },
      { id: 'a1', role: 'assistant', content: 'A1', status: 'done' },
      { id: 'u2', role: 'user', content: 'Q2' },
      { id: 'a2', role: 'assistant', content: 'A2', status: 'done' },
      { id: 'u3', role: 'user', content: 'Q3' },
      { id: 'a3', role: 'assistant', content: 'A3', status: 'done' }
    ]
    const { host, unmount } = mountList({
      messages,
      welcome: '提示',
      showWelcome: false,
      showNavigator: false
    })

    const container = host.querySelector<HTMLElement>(
      '.u-ai-message-list__scroll .u-scroll__container'
    )!
    Object.defineProperty(container, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(container, 'clientHeight', { value: 500, configurable: true })
    container.dispatchEvent(new Event('scroll'))
    await nextTick()

    expect(host.querySelector('.u-ai-message-list__welcome')).toBeFalsy()
    expect(host.querySelector('.u-ai-session-nav')).toBeFalsy()
    unmount()
  })

  it('独立传 tools / toolIcons / #tool-<name> 插槽，并触发 respond / open-panel / preview-image / regenerate', async () => {
    const CustomIcon = defineComponent({ setup: () => () => h('svg', { class: 'list-tool-icon' }) })
    const ReplyCard = defineComponent({
      props: { toolCall: { type: Object as PropType<ChatToolCall>, required: true } },
      setup: (props) => () => h('div', { class: 'reply-card' }, `reply:${props.toolCall.name}`)
    })
    const tools: ChatToolMeta[] = [
      { name: 'confirmTool', label: '确认工具' },
      { name: 'panelTool', label: '面板工具', renderTo: 'panel' },
      { name: 'replyTool', renderTo: 'reply', render: ReplyCard, hideInSteps: true },
      { name: 'slotTool', label: '插槽工具' }
    ]
    const messages: ChatMessage[] = [
      {
        id: 'u1',
        role: 'user',
        content: '提问',
        attachments: [
          { name: 'img.png', mimeType: 'image/png', size: 10, dataUrl: 'data:image/png;base64,CC' }
        ]
      },
      {
        id: 'a1',
        role: 'assistant',
        content: '最终答复',
        status: 'done',
        toolCalls: [
          { id: 'c1', name: 'confirmTool', arguments: '{}', status: 'awaiting-confirm' },
          { id: 'c2', name: 'panelTool', arguments: '{}', status: 'success' },
          { id: 'c3', name: 'replyTool', arguments: '{}', status: 'success' },
          { id: 'c4', name: 'slotTool', arguments: '{}', result: 'ok', status: 'success' }
        ]
      }
    ]

    const onRespond = vi.fn()
    const onRegenerate = vi.fn()
    const onOpenPanel = vi.fn()
    const onPreviewImage = vi.fn()

    const { host, unmount } = mountList(
      {
        messages,
        tools,
        toolIcons: { slotTool: CustomIcon },
        onRespond,
        onRegenerate,
        onOpenPanel,
        onPreviewImage
      },
      {
        'tool-slotTool': (scope) =>
          h(
            'div',
            { class: 'list-slot-tool' },
            `slot:${scope.toolCall.id}:${scope.toolCall.result}`
          )
      }
    )

    // reply 工具渲染在回复流
    expect(host.querySelector('.u-ai-message-list__reply-tool .reply-card')?.textContent).toBe(
      'reply:replyTool'
    )

    // 点击用户消息图片预览
    host.querySelector<HTMLElement>('.u-ai-bubble__attachments .u-ai-attachments__image')!.click()
    expect(onPreviewImage).toHaveBeenCalledTimes(1)
    expect(onPreviewImage).toHaveBeenCalledWith('data:image/png;base64,CC', 'img.png')

    // 点击重新生成
    host.querySelector<HTMLElement>('[title="重新生成"]')!.click()
    expect(onRegenerate).toHaveBeenCalledTimes(1)

    // 展开步骤行验证 toolIcons、#tool-slotTool、respond 与 open-panel
    host.querySelector<HTMLElement>('.u-ai-step-group__bar')!.click()
    await nextTick()
    expect(host.querySelector('.list-tool-icon')).toBeTruthy()

    // 点击审批允许
    const allowBtn = [
      ...host.querySelectorAll<HTMLElement>('.u-ai-tool-call__confirm button')
    ].find((b) => b.textContent?.includes('允许'))!
    allowBtn.click()
    expect(onRespond).toHaveBeenCalledWith('c1', true)

    // 展开 panelTool 和 slotTool
    const headers = host.querySelectorAll<HTMLElement>('.u-ai-tool-call .u-collapse__header')
    headers[1]!.click()
    headers[2]!.click()
    await nextTick()
    await nextTick()

    expect(host.querySelector('.list-slot-tool')?.textContent).toBe('slot:c4:ok')
    host.querySelector<HTMLElement>('.u-ai-tool-call__panel-entry button')!.click()
    expect(onOpenPanel).toHaveBeenCalledTimes(1)
    expect(onOpenPanel).toHaveBeenCalledWith('c2')
    unmount()
  })

  it('expose scrollToLatest 与 jumpToTurn 控制列表滚动与吸底态', async () => {
    const messages: ChatMessage[] = [
      { id: 'u1', role: 'user', content: '一' },
      { id: 'a1', role: 'assistant', content: '答一', status: 'done' },
      { id: 'u2', role: 'user', content: '二' },
      { id: 'a2', role: 'assistant', content: '答二', status: 'done' }
    ]
    const { host, list, unmount } = mountList({ messages })

    const container = host.querySelector<HTMLElement>(
      '.u-ai-message-list__scroll .u-scroll__container'
    )!
    const scrolled: { top?: number; behavior?: ScrollBehavior }[] = []
    container.scrollTo = ((opts: ScrollToOptions) => {
      scrolled.push({ top: opts.top, behavior: opts.behavior })
    }) as typeof container.scrollTo

    // 调用 jumpToTurn 取消吸底并滚向目标轮次
    list.value?.jumpToTurn('u1')
    await nextTick()
    expect(scrolled).toHaveLength(1)
    expect(scrolled[0]?.behavior).toBe('smooth')
    expect(host.querySelector('.u-ai-message-list__to-latest')).toBeTruthy()

    // 调用 scrollToLatest 恢复吸底
    await list.value?.scrollToLatest()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-message-list__to-latest')).toBeFalsy()
    })
    expect(scrolled.length).toBeGreaterThanOrEqual(2)
    unmount()
  })
})

const isAfter = (a: Element, b: Element) =>
  !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

describe('UAiMessageList reply 卡片相对正文的位置', () => {
  const ReplyCard = defineComponent({
    props: { toolCall: { type: Object as PropType<ChatToolCall>, required: true } },
    setup: (props) => () => h('div', { class: 'reply-card' }, props.toolCall.id)
  })
  const tools: ChatToolMeta[] = [
    { name: 'askQuestion', renderTo: 'reply', render: ReplyCard, hideInSteps: true }
  ]

  function mountReply(message: ChatMessage) {
    return mountList({
      messages: [{ id: 'u1', role: 'user', content: '帮我建模' }, message],
      tools,
      showWelcome: false,
      showNavigator: false
    })
  }

  it('mock：工具在正文之前到达，卡片在后补正文前', () => {
    const { host, unmount } = mountReply({
      id: 'a1',
      role: 'assistant',
      content: '后补的说明',
      status: 'done',
      toolCalls: [
        { id: 'q1', name: 'askQuestion', arguments: '{}', status: 'pending', contentOffset: 0 }
      ]
    })
    const card = host.querySelector('.u-ai-message-list__reply-tool')!
    const answer = host.querySelector('.md-stub')!
    expect(card.textContent).toContain('q1')
    expect(answer.textContent).toBe('后补的说明')
    expect(isAfter(card, answer)).toBe(true)
    unmount()
  })

  it('mock：工具在正文写完之后到达，卡片在整段正文后', () => {
    const { host, unmount } = mountReply({
      id: 'a1',
      role: 'assistant',
      content: '已经写完的回复',
      status: 'done',
      toolCalls: [{ id: 'q1', name: 'askQuestion', arguments: '{}', status: 'pending' }]
    })
    const card = host.querySelector('.u-ai-message-list__reply-tool')!
    const answer = host.querySelector('.md-stub')!
    expect(answer.textContent).toBe('已经写完的回复')
    expect(isAfter(answer, card)).toBe(true)
    unmount()
  })

  it('mock：工具落在正文中间，同一气泡内是前文、卡片、后文，复制仍是整段', async () => {
    const content = '先说一句再补充'
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const { host, unmount } = mountReply({
      id: 'a1',
      role: 'assistant',
      content,
      status: 'error',
      toolCalls: [
        {
          id: 'q1',
          name: 'askQuestion',
          arguments: '{}',
          status: 'pending',
          contentOffset: '先说一句'.length
        }
      ]
    })
    const bubble = host.querySelector('.u-ai-bubble--assistant')!
    const stubs = [...bubble.querySelectorAll('.md-stub')]
    const card = bubble.querySelector('.u-ai-message-list__reply-tool')!
    expect(host.querySelectorAll('.u-ai-bubble--assistant')).toHaveLength(1)
    expect(stubs.map((el) => el.textContent)).toEqual(['先说一句', '再补充'])
    expect(isAfter(stubs[0]!, card)).toBe(true)
    expect(isAfter(card, stubs[1]!)).toBe(true)
    expect(bubble.querySelectorAll('.u-ai-bubble__status')).toHaveLength(1)
    expect(bubble.querySelector('.u-ai-bubble__status')?.textContent).toBe('生成出错')
    expect(host.querySelectorAll('[title="复制"]')).toHaveLength(1)
    host.querySelector<HTMLElement>('[title="复制"]')!.click()
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(content)
    })
    vi.unstubAllGlobals()
    unmount()
  })

  it('mock：偏移落在围栏代码块靠近块尾时，卡片放在整块代码之后', () => {
    const content = ['开头说明', '', '```ts', 'const a = 1', '```', '', '结尾'].join('\n')
    const { host, unmount } = mountReply({
      id: 'a1',
      role: 'assistant',
      content,
      status: 'done',
      toolCalls: [
        {
          id: 'q1',
          name: 'askQuestion',
          arguments: '{}',
          status: 'pending',
          contentOffset: content.lastIndexOf('1')
        }
      ]
    })
    const bubble = host.querySelector('.u-ai-bubble--assistant')!
    const stubs = [...bubble.querySelectorAll('.md-stub')]
    const card = bubble.querySelector('.u-ai-message-list__reply-tool')!
    expect(stubs).toHaveLength(2)
    expect(stubs[0]?.textContent).toContain('const a = 1')
    expect(stubs[0]?.textContent).toContain('```')
    expect(stubs[1]?.textContent).toBe('\n结尾')
    expect(isAfter(stubs[0]!, card)).toBe(true)
    expect(isAfter(card, stubs[1]!)).toBe(true)
    unmount()
  })
})
