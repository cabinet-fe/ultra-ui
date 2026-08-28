import { describe, expect, it, vi } from 'vitest'
import {
  createApp,
  defineComponent,
  h,
  nextTick,
  reactive,
  ref,
  type Component,
  type PropType
} from 'vue'

import { createServerTransport, type ChatSessionEvent } from '../../../chat/session'
import type {
  ChatMessage,
  ChatTool,
  ChatToolCall,
  ChatToolMeta,
  ChatTransport
} from '../../../chat/types'
import type { ChatModelOption } from '../../../providers'
import type { AiChatExposed, AiChatProps } from '../../../types'
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

function mountAiChat(options: {
  transport: AiChatProps['transport']
  tools?: AiChatProps['tools']
  welcome?: string | string[]
  models?: ChatModelOption[]
  model?: string
  reasoningLevel?: string
  tokenUsageDetail?: boolean
  messages?: ChatMessage[]
  toolIcons?: Record<string, Component>
  slots?: Record<string, (scope: any) => any>
}) {
  const host = document.createElement('div')
  document.body.appendChild(host)

  const chatRef = ref<AiChatExposed>()

  const app = createApp({
    render() {
      return h(
        UAiChat,
        {
          ref: chatRef,
          transport: options.transport,
          tools: options.tools,
          welcome: options.welcome,
          models: options.models,
          model: options.model,
          reasoningLevel: options.reasoningLevel,
          tokenUsageDetail: options.tokenUsageDetail,
          messages: options.messages,
          toolIcons: options.toolIcons
        },
        options.slots
      )
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

/** 最终答案输出后过程消息收进「已完成」折叠块：点击展开并等待过程 DOM 挂载 */
async function expandProcess(host: HTMLElement) {
  await vi.waitFor(() => {
    expect(host.querySelector('.u-ai-chat__process-header')).toBeTruthy()
  })
  host.querySelector<HTMLElement>('.u-ai-chat__process-header')!.click()
  await nextTick()
}

describe('UAiChat', () => {
  it('空状态显示欢迎语', () => {
    const { host, unmount } = mountAiChat({ transport: () => {}, welcome: '有什么可以帮你？' })

    expect(host.querySelector('.u-ai-chat__welcome')?.textContent).toContain('有什么可以帮你？')
    const orb = host.querySelector('.u-ai-chat__welcome canvas.u-ai-orb') as HTMLElement | null
    expect(orb?.style.width).toBe('48px')
    expect(host.querySelector('.u-ai-chat__list .u-ai-chat__welcome')).toBeFalsy()
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

  it('对话结束后展示复制与重新生成操作，复制写入剪贴板', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

    const transport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('可复制的内容')
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('你好')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__message-actions')).toBeTruthy()
    })

    const actions = host.querySelectorAll('.u-ai-chat__message-actions .u-button')
    expect(actions).toHaveLength(2)
    expect(actions[0]?.classList.contains('is-circle')).toBe(true)
    expect(actions[0]?.getAttribute('title')).toBe('复制')
    expect(actions[1]?.classList.contains('is-circle')).toBe(true)
    expect(actions[1]?.getAttribute('title')).toBe('重新生成')

    actions[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('可复制的内容')
      expect(actions[0]?.getAttribute('title')).toBe('已复制')
    })

    vi.unstubAllGlobals()
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

    // 最终答案输出后，工具卡片收进「已完成」过程块，先展开
    await expandProcess(host)

    expect(host.querySelector('.u-ai-chat__tool-call-name')?.textContent).toBe('calculate')
    expect(host.querySelector('.u-ai-chat__tool-call.is-success')).toBeTruthy()

    // 执行完成后自动折叠，点击头部展开
    const header = host.querySelector<HTMLElement>('.u-ai-chat__tool-call .u-collapse__header')!
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    await nextTick()

    const body = host.querySelector('.u-ai-chat__tool-call .u-collapse__content-wrapper')
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

  it('工具支持自定义 icon 与 label', async () => {
    let round = 0
    const transport: ChatTransport = (_req, handlers) => {
      round++
      if (round === 1) {
        handlers.onToolCall?.({ id: 'c1', name: 'search', arguments: '{"q":"vue"}' })
      } else {
        handlers.onTextDelta('搜到了')
      }
    }
    const CustomIcon = defineComponent({
      setup: () => () => h('svg', { class: 'custom-tool-icon' })
    })
    const tools: ChatTool[] = [
      {
        name: 'search',
        label: '搜索',
        icon: CustomIcon,
        description: '搜索',
        parameters: {},
        execute: () => ({ hits: 3 })
      }
    ]
    const { host, chat, unmount } = mountAiChat({ transport, tools })

    chat.value?.send('搜一下 vue')

    // 最终答案输出后工具卡片收进「已完成」过程块，展开后断言
    await expandProcess(host)

    expect(host.querySelector('.u-ai-chat__tool-call-name')?.textContent).toBe('搜索')
    expect(host.querySelector('.custom-tool-icon')).toBeTruthy()
    unmount()
  })

  /** 渲染 toolCall.result 的自定义视图桩 */
  const createResultView = (className: string) =>
    defineComponent({
      props: { toolCall: { type: Object as PropType<ChatToolCall>, required: true } },
      setup(props) {
        return () => h('div', { class: className }, `result:${props.toolCall.result ?? ''}`)
      }
    })

  /** 第一轮发起 getWeather 工具调用，第二轮输出文本 */
  const createWeatherTransport = () => {
    let round = 0
    const transport: ChatTransport = (_req, handlers) => {
      round++
      if (round === 1) {
        handlers.onToolCall?.({ id: 'c1', name: 'getWeather', arguments: '{"city":"北京"}' })
      } else {
        handlers.onTextDelta('查好了')
      }
    }
    return transport
  }

  const weatherTool = (extra: Partial<ChatTool> = {}): ChatTool => ({
    name: 'getWeather',
    description: '查天气',
    parameters: {},
    execute: () => ({ temperature: 26 }),
    ...extra
  })

  it('render 自定义渲染替换卡片 body，完成后保持展开', async () => {
    const tools = [weatherTool({ render: createResultView('weather-view') })]
    const { host, chat, unmount } = mountAiChat({ transport: createWeatherTransport(), tools })

    chat.value?.send('北京天气')

    // 最终答案输出后工具卡片收进「已完成」过程块，展开后 render 保持展开态
    await expandProcess(host)

    // 完成后保持展开，默认参数/结果区被替换
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__tool-call.is-success.is-active')).toBeTruthy()
    })
    expect(host.querySelector('.weather-view')?.textContent).toContain('{"temperature":26}')
    expect(host.querySelector('.u-ai-chat__tool-call-code')).toBeFalsy()
    unmount()
  })

  it('autoCollapse: false 的普通工具完成后保持展开', async () => {
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
      {
        name: 'calculate',
        description: '计算',
        parameters: {},
        autoCollapse: false,
        execute: () => ({ value: 2 })
      }
    ]
    const { host, chat, unmount } = mountAiChat({ transport, tools })

    chat.value?.send('1+1')

    await expandProcess(host)

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__tool-call.is-success.is-active')).toBeTruthy()
    })
    expect(
      host.querySelector('.u-ai-chat__tool-call .u-collapse__content-wrapper')?.textContent
    ).toContain('"value": 2')
    unmount()
  })

  it('render 工具设置 autoCollapse: true 后完成即折叠', async () => {
    const tools = [weatherTool({ render: createResultView('weather-view'), autoCollapse: true })]
    const { host, chat, unmount } = mountAiChat({ transport: createWeatherTransport(), tools })

    chat.value?.send('北京天气')

    await expandProcess(host)

    expect(host.querySelector('.u-ai-chat__tool-call.is-success')).toBeTruthy()
    expect(host.querySelector('.u-ai-chat__tool-call.is-active')).toBeFalsy()
    const body = host.querySelector('.u-ai-chat__tool-call .u-collapse__content-wrapper')
    expect(body?.getAttribute('aria-hidden')).toBe('true')
    unmount()
  })

  it('终态工具卡片折叠后卸载内容 DOM，展开时重新挂载', async () => {
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

    // 过程块展开后，工具卡片重挂载为完成态（自动折叠）
    await expandProcess(host)

    // 完成后自动折叠：内容 DOM 已卸载（减少内存与渲染成本），包装容器保留
    expect(host.querySelector('.u-ai-chat__tool-call.is-active')).toBeFalsy()
    expect(host.querySelector('.u-ai-chat__tool-call .u-collapse__content')).toBeFalsy()
    expect(host.querySelector('.u-ai-chat__tool-call .u-collapse__content-wrapper')).toBeTruthy()

    // 展开后内容重新挂载
    const header = host.querySelector<HTMLElement>('.u-ai-chat__tool-call .u-collapse__header')!
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__tool-call .u-collapse__content')?.textContent).toContain(
      '"value": 2'
    )
    unmount()
  })

  it('思考过程流式结束后自动折叠并卸载内容 DOM', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onReasoningDelta?.('先分析一下问题')
      handlers.onTextDelta('答案')
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('hi')

    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('答案')
    })

    // 结束后自动折叠：头部保留，内容 DOM 完全卸载
    expect(host.querySelector('.u-ai-chat__reasoning-title')?.textContent).toContain('思考过程')
    expect(host.querySelector('.u-ai-chat__reasoning-content')).toBeFalsy()

    // 展开后内容重新挂载
    host.querySelector<HTMLElement>('.u-ai-chat__reasoning-header')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__reasoning-text')?.textContent).toContain(
      '先分析一下问题'
    )
    unmount()
  })

  it('最终答案输出后过程消息收进「已完成」折叠块，可展开钻取', async () => {
    let round = 0
    const transport: ChatTransport = (_req, handlers) => {
      round++
      if (round === 1) {
        handlers.onReasoningDelta?.('先分析一下')
        handlers.onToolCall?.({ id: 'c1', name: 'calculate', arguments: '{"expression":"1+1"}' })
      } else {
        handlers.onTextDelta('答案是 2')
      }
    }
    const tools: ChatTool[] = [
      { name: 'calculate', description: '计算', parameters: {}, execute: () => ({ value: 2 }) }
    ]
    const { host, chat, unmount } = mountAiChat({ transport, tools })

    chat.value?.send('1+1 等于几')

    // 最终答案输出后：出现「已完成」折叠头，过程 DOM（思考块/工具卡片）卸载，答案仍在块外
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__process-title')?.textContent).toBe('已完成')
    })
    expect(host.querySelector('.u-ai-chat__process-content')).toBeFalsy()
    expect(host.querySelector('.u-ai-chat__tool-call')).toBeFalsy()
    expect(host.querySelector('.u-ai-chat__reasoning')).toBeFalsy()
    expect(host.querySelector('.md-stub')?.textContent).toContain('答案是 2')

    // 点击展开：过程消息可见，思考块默认折叠（可逐层钻取）
    host.querySelector<HTMLElement>('.u-ai-chat__process-header')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__reasoning-title')?.textContent).toContain('思考过程')
    expect(host.querySelector('.u-ai-chat__reasoning-content')).toBeFalsy()
    expect(host.querySelector('.u-ai-chat__tool-call-name')?.textContent).toBe('calculate')

    // 再次收起：过程 DOM 重新卸载
    host.querySelector<HTMLElement>('.u-ai-chat__process-header')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__process-content')).toBeFalsy()
    expect(host.querySelector('.u-ai-chat__tool-call')).toBeFalsy()
    unmount()
  })

  it('单轮无工具对话不出现「已完成」过程块', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onReasoningDelta?.('想一下')
      handlers.onTextDelta('你好')
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('hi')
    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('你好')
    })
    expect(host.querySelector('.u-ai-chat__process')).toBeFalsy()
    unmount()
  })

  it('流式期间用户上滚取消吸底，展示「最新消息」入口且不被后续输出重新吸附', async () => {
    const transport: ChatTransport = async (_req, handlers) => {
      handlers.onTextDelta('第一段')
      await new Promise((resolve) => setTimeout(resolve, 30))
      handlers.onTextDelta('第二段')
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('hi')
    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('第一段')
    })
    expect(host.querySelector('.u-ai-chat__to-latest')).toBeFalsy()

    // 用户向上滚动 → 立即取消吸附，展示回底入口
    const container = host.querySelector<HTMLElement>('.u-ai-chat__list .u-scroll__container')!
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
    await nextTick()
    expect(host.querySelector('.u-ai-chat__to-latest')).toBeTruthy()

    // 后续流式输出不会把用户拉回底部（入口仍在）
    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('第二段')
    })
    expect(host.querySelector('.u-ai-chat__to-latest')).toBeTruthy()
    unmount()
  })

  it('render 优先于 tool-<name> 插槽', async () => {
    const tools = [weatherTool({ render: createResultView('weather-view') })]
    const { host, chat, unmount } = mountAiChat({
      transport: createWeatherTransport(),
      tools,
      slots: { 'tool-getWeather': () => h('div', { class: 'slot-view' }, 'slot') }
    })

    chat.value?.send('北京天气')

    await expandProcess(host)

    expect(host.querySelector('.u-ai-chat__tool-call.is-success')).toBeTruthy()
    expect(host.querySelector('.weather-view')).toBeTruthy()
    expect(host.querySelector('.slot-view')).toBeFalsy()
    unmount()
  })

  /** 渲染 toolCall.arguments 的自定义视图桩（区分多次调用） */
  const createArgsView = (className: string) =>
    defineComponent({
      props: { toolCall: { type: Object as PropType<ChatToolCall>, required: true } },
      setup(props) {
        return () => h('div', { class: className }, `args:${props.toolCall.arguments}`)
      }
    })

  /** 第一轮发起 openPage 工具调用，第二轮输出文本 */
  const createPageTransport = (calls: { id: string; arguments: string }[] = []) => {
    let round = 0
    const transport: ChatTransport = (_req, handlers) => {
      round++
      if (round === 1) {
        const list = calls.length ? calls : [{ id: 'c1', arguments: '{"page":"form"}' }]
        for (const call of list) {
          handlers.onToolCall?.({ ...call, name: 'openPage' })
        }
      } else {
        handlers.onTextDelta('已在右侧打开')
      }
    }
    return transport
  }

  const pageTool = (extra: Partial<ChatTool> = {}): ChatTool => ({
    name: 'openPage',
    label: '后台页面',
    description: '打开后台页面',
    parameters: {},
    execute: () => ({ opened: true }),
    ...extra
  })

  it('renderTo: panel 工具在右侧面板渲染，卡片 body 仅提供查看入口', async () => {
    const tools = [pageTool({ render: createResultView('page-view'), renderTo: 'panel' })]
    const { host, chat, unmount } = mountAiChat({ transport: createPageTransport(), tools })

    chat.value?.send('打开表单页')

    // 面板自动打开，render 组件挂在面板中，面板标题取工具 label
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__panel .page-view')).toBeTruthy()
    })
    expect(host.querySelector('.u-ai-chat__panel-title')?.textContent).toBe('后台页面')

    // 最终答案输出后工具卡片收进「已完成」过程块，展开后断言
    await expandProcess(host)

    // 卡片 body 不渲染 render 组件，仅提供「查看面板」入口
    expect(host.querySelector('.u-ai-chat__tool-call.is-success')).toBeTruthy()
    expect(host.querySelector('.u-ai-chat__tool-call .page-view')).toBeFalsy()
    expect(host.querySelector('.u-ai-chat__tool-call-panel-entry')).toBeTruthy()
    unmount()
  })

  it('面板可关闭，点击工具卡片入口重新打开', async () => {
    const tools = [pageTool({ render: createResultView('page-view'), renderTo: 'panel' })]
    const { host, chat, unmount } = mountAiChat({ transport: createPageTransport(), tools })

    chat.value?.send('打开表单页')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__panel')).toBeTruthy()
    })

    host.querySelector<HTMLElement>('.u-ai-chat__panel-close')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__panel')).toBeFalsy()

    // 卡片已收进「已完成」过程块，展开后点击入口
    await expandProcess(host)

    const entryBtn = [
      ...host.querySelectorAll<HTMLElement>('.u-ai-chat__tool-call-panel-entry button')
    ].find((btn) => btn.textContent?.includes('查看面板'))!
    entryBtn.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__panel .page-view')).toBeTruthy()
    unmount()
  })

  it('新的面板调用自动聚焦，卡片入口可切回历史调用', async () => {
    const tools = [pageTool({ render: createArgsView('page-view'), renderTo: 'panel' })]
    const transport = createPageTransport([
      { id: 'c1', arguments: '{"page":"form"}' },
      { id: 'c2', arguments: '{"page":"list"}' }
    ])
    const { host, chat, unmount } = mountAiChat({ transport, tools })

    chat.value?.send('打开表单页和列表页')

    // 自动聚焦最近一次面板调用（list）
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__panel .page-view')?.textContent).toContain('list')
    })

    // 卡片已收进「已完成」过程块，展开后点击第一张卡片的「查看面板」切回 form
    await expandProcess(host)

    const firstCard = host.querySelectorAll<HTMLElement>('.u-ai-chat__tool-call')[0]!
    const entryBtn = [
      ...firstCard.querySelectorAll<HTMLElement>('.u-ai-chat__tool-call-panel-entry button')
    ].find((btn) => btn.textContent?.includes('查看面板'))!
    entryBtn.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__panel .page-view')?.textContent).toContain('form')
    unmount()
  })

  it('面板与会话区经 ULayout 列轨分隔并渲染拖拽手柄', async () => {
    const tools = [pageTool({ render: createResultView('page-view'), renderTo: 'panel' })]
    const { host, chat, unmount } = mountAiChat({ transport: createPageTransport(), tools })

    chat.value?.send('打开表单页')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__panel')).toBeTruthy()
    })

    // 面板默认宽：容器宽度未知（测试环境 clientWidth 为 0）时回退 420px，ULayout 渲染列间拖拽手柄
    const layout = host.querySelector<HTMLElement>('.u-ai-chat')!
    expect(layout.style.gridTemplateColumns).toBe('1fr 420px')
    expect(host.querySelector('.u-layout__resizer')).toBeTruthy()

    // 面板关闭后回到单列，手柄移除
    host.querySelector<HTMLElement>('.u-ai-chat__panel-close')!.click()
    await vi.waitFor(() => {
      expect(layout.style.gridTemplateColumns).toBe('1fr')
      expect(host.querySelector('.u-layout__resizer')).toBeFalsy()
    })
    unmount()
  })

  it('面板工具可通过 panelWidth 指定默认宽度', async () => {
    const tools = [
      pageTool({ render: createResultView('page-view'), renderTo: 'panel', panelWidth: 480 })
    ]
    const { host, chat, unmount } = mountAiChat({ transport: createPageTransport(), tools })

    chat.value?.send('打开表单页')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__panel')).toBeTruthy()
    })
    const layout = host.querySelector<HTMLElement>('.u-ai-chat')!
    expect(layout.style.gridTemplateColumns).toBe('1fr 480px')
    unmount()
  })

  it('不同工具面板切换时应用各自的 panelWidth', async () => {
    const reportTool: ChatTool = {
      name: 'openReport',
      label: '报表页面',
      description: '打开报表',
      parameters: {},
      render: createResultView('report-view'),
      renderTo: 'panel',
      panelWidth: 640,
      execute: () => ({ opened: true })
    }
    const tools = [
      pageTool({ render: createResultView('page-view'), renderTo: 'panel', panelWidth: 480 }),
      reportTool
    ]
    let round = 0
    const transport: ChatTransport = (_req, handlers) => {
      round++
      if (round === 1) {
        handlers.onToolCall?.({ id: 'c1', name: 'openPage', arguments: '{"page":"form"}' })
        handlers.onToolCall?.({ id: 'c2', name: 'openReport', arguments: '{}' })
      } else {
        handlers.onTextDelta('已打开')
      }
    }
    const { host, chat, unmount } = mountAiChat({ transport, tools })

    chat.value?.send('打开表单页和报表页')

    // 自动聚焦最近一次调用（openReport → 640px）
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__panel .report-view')).toBeTruthy()
    })
    const layout = host.querySelector<HTMLElement>('.u-ai-chat')!
    expect(layout.style.gridTemplateColumns).toBe('1fr 640px')

    // 卡片已收进「已完成」过程块，展开后点击 openPage 卡片的「查看面板」→ 切换并应用 480px
    await expandProcess(host)

    const firstCard = host.querySelectorAll<HTMLElement>('.u-ai-chat__tool-call')[0]!
    const entryBtn = [
      ...firstCard.querySelectorAll<HTMLElement>('.u-ai-chat__tool-call-panel-entry button')
    ].find((btn) => btn.textContent?.includes('查看面板'))!
    entryBtn.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__panel .page-view')).toBeTruthy()
    expect(layout.style.gridTemplateColumns).toBe('1fr 480px')
    unmount()
  })

  it('输入区使用原生 textarea 与 UFilePicker', () => {
    const { host, unmount } = mountAiChat({ transport: () => {} })

    expect(host.querySelector('textarea.u-ai-chat__input')).toBeTruthy()
    expect(host.querySelector('.u-ai-chat__input-toolbar-left .u-file-picker')).toBeTruthy()
    unmount()
  })

  it('受控 v-model:messages 绑定下流式回复正常渲染', async () => {
    const messages = ref<ChatMessage[]>([])
    const chatRef = ref<AiChatExposed>()
    const transport: ChatTransport = async (_req, handlers) => {
      // 留出父级 patch props 的时间窗，还原真实的回显时序
      await new Promise((resolve) => setTimeout(resolve, 10))
      handlers.onTextDelta('受控回答')
    }
    const host = document.createElement('div')
    document.body.appendChild(host)

    const app = createApp({
      setup() {
        return () =>
          h(UAiChat, {
            ref: chatRef,
            transport,
            messages: messages.value,
            'onUpdate:messages': (value: ChatMessage[]) => {
              messages.value = value
            }
          })
      }
    })
    app.mount(host)

    chatRef.value?.send('你好')
    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('受控回答')
    })
    // 父级持有的快照最终也包含 assistant 回复
    expect(messages.value.some((m) => m.role === 'assistant' && m.content === '受控回答')).toBe(
      true
    )

    app.unmount()
    host.remove()
  })

  it('生成中空输入显示停止，有内容则显示入队发送', async () => {
    const transport: ChatTransport = (req) => {
      return new Promise<void>((resolve) => {
        req.signal.addEventListener('abort', () => resolve(), { once: true })
      })
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('hi')
    await nextTick()

    const actionButtons = () => host.querySelectorAll('.u-ai-chat__input-toolbar-right > .u-button')

    expect(host.querySelector('.u-ai-chat__input-stop')).toBeTruthy()
    expect(actionButtons()).toHaveLength(1)

    const textarea = host.querySelector<HTMLTextAreaElement>('textarea.u-ai-chat__input')!
    textarea.value = '下一条'
    textarea.dispatchEvent(new Event('input'))
    await nextTick()

    expect(host.querySelector('.u-ai-chat__input-stop')).toBeFalsy()
    expect(actionButtons()).toHaveLength(1)
    const sendBtn = actionButtons()[0]!
    expect(sendBtn.classList.contains('is-disabled')).toBe(false)
    expect(sendBtn.getAttribute('title')).toBe('加入待发送队列')

    sendBtn.click()
    await nextTick()

    expect(
      [...host.querySelectorAll('.u-ai-chat__queue-text')].map((el) => el.textContent)
    ).toEqual(['下一条'])
    expect(textarea.value).toBe('')
    expect(host.querySelector('.u-ai-chat__input-stop')).toBeTruthy()

    chat.value?.abort()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__input-stop')).toBeFalsy()
    })
    unmount()
  })

  it('有 models 时渲染模型选择器；当前模型无 reasoningLevels 时不展示推理等级', async () => {
    const { host, unmount } = mountAiChat({
      transport: () => {},
      models: [
        { id: 'gpt-4o', label: 'GPT-4o', providerId: 'openai' },
        {
          id: 'o3-mini',
          label: 'o3-mini',
          providerId: 'openai',
          reasoningLevels: [
            { value: 'low', label: '低' },
            { value: 'high', label: '高' }
          ],
          defaultReasoningLevel: 'low'
        }
      ],
      model: 'gpt-4o'
    })

    await nextTick()
    // 模型选择器在右簇（发送按钮左侧），不在附件侧
    expect(
      host.querySelector('.u-ai-chat__input-toolbar-right .u-ai-chat__model-trigger')
    ).toBeTruthy()
    expect(
      host.querySelector('.u-ai-chat__input-toolbar-left .u-ai-chat__model-trigger')
    ).toBeFalsy()
    // 当前模型无 reasoningLevels，触发器不展示推理等级
    expect(host.querySelector('.u-ai-chat__model-trigger-reasoning')).toBeFalsy()
    unmount()
  })

  it('切换到带 reasoningLevels 的模型后触发器展示推理等级', async () => {
    const model = ref('gpt-4o')
    const reasoningLevel = ref<string | undefined>()
    const host = document.createElement('div')
    document.body.appendChild(host)

    const app = createApp({
      setup() {
        return () =>
          h(UAiChat, {
            transport: () => {},
            models: [
              { id: 'gpt-4o', label: 'GPT-4o', providerId: 'openai' },
              {
                id: 'o3-mini',
                label: 'o3-mini',
                providerId: 'openai',
                reasoningLevels: [
                  { value: 'low', label: '低' },
                  { value: 'high', label: '高' }
                ],
                defaultReasoningLevel: 'low'
              }
            ],
            model: model.value,
            'onUpdate:model': (v: string | undefined) => {
              model.value = v ?? ''
            },
            reasoningLevel: reasoningLevel.value,
            'onUpdate:reasoningLevel': (v: string | undefined) => {
              reasoningLevel.value = v
            }
          })
      }
    })
    app.mount(host)
    await nextTick()

    expect(host.querySelector('.u-ai-chat__model-trigger-reasoning')).toBeFalsy()

    model.value = 'o3-mini'
    await nextTick()

    const reasoning = host.querySelector(
      '.u-ai-chat__input-toolbar-right .u-ai-chat__model-trigger-reasoning'
    )
    expect(reasoning).toBeTruthy()
    expect(reasoning?.textContent).toBe('低')
    expect(reasoningLevel.value).toBe('low')

    app.unmount()
    host.remove()
  })

  it('生成中提交的消息进入队列并渲染队列 UI', async () => {
    const transport: ChatTransport = (req) => {
      return new Promise<void>((resolve) => {
        req.signal.addEventListener('abort', () => resolve(), { once: true })
      })
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('第一条')
    await nextTick()
    chat.value?.send('第二条')
    chat.value?.send('第三条')
    await nextTick()

    const items = [...host.querySelectorAll('.u-ai-chat__queue-text')].map((el) => el.textContent)
    expect(items).toEqual(['第二条', '第三条'])
    expect(host.querySelector('.u-ai-chat__queue-head')?.textContent).toContain('2')
    unmount()
  })

  it('队列「立即开始」中断当前会话并插队执行', async () => {
    const transport: ChatTransport = (req, handlers) => {
      const lastUser = [...req.messages].reverse().find((m) => m.role === 'user')
      if (lastUser?.content === '第一条') {
        return new Promise<void>((resolve) => {
          req.signal.addEventListener('abort', () => resolve(), { once: true })
        })
      }
      handlers.onTextDelta(`回答:${lastUser?.content}`)
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('第一条')
    await nextTick()
    chat.value?.send('第二条')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__queue-item')).toBeTruthy()
    })

    const startBtn = [...host.querySelectorAll<HTMLElement>('.u-ai-chat__queue-action')].find(
      (btn) => btn.textContent?.includes('立即开始')
    )!
    startBtn.click()

    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('回答:第二条')
    })
    // 第一条被中断，队列已清空
    expect(host.textContent).toContain('已停止生成')
    expect(host.querySelector('.u-ai-chat__queue')).toBeFalsy()
    unmount()
  })

  it('队列「编辑」取回输入框，重新提交后插回原位置', async () => {
    const transport: ChatTransport = (req) => {
      return new Promise<void>((resolve) => {
        req.signal.addEventListener('abort', () => resolve(), { once: true })
      })
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('第一条')
    await nextTick()
    chat.value?.send('A')
    chat.value?.send('B')
    await nextTick()

    // 点击 A 的编辑按钮
    const itemA = [...host.querySelectorAll<HTMLElement>('.u-ai-chat__queue-item')].find((el) =>
      el.textContent?.includes('A')
    )!
    itemA.querySelector<HTMLElement>('[title="取回输入框编辑"]')!.click()
    await nextTick()

    const textarea = host.querySelector<HTMLTextAreaElement>('textarea.u-ai-chat__input')!
    expect(textarea.value).toBe('A')
    expect(
      [...host.querySelectorAll('.u-ai-chat__queue-text')].map((el) => el.textContent)
    ).toEqual(['B'])

    // 修改内容并提交（仍在生成中）→ 回到队列原位置（B 之前）
    textarea.value = 'A2'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()

    expect(
      [...host.querySelectorAll('.u-ai-chat__queue-text')].map((el) => el.textContent)
    ).toEqual(['A2', 'B'])
    unmount()
  })

  it('welcome 逐条展示：点击文案发送，点击球立即换下一条', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('收到')
    }
    const { host, unmount } = mountAiChat({ transport, welcome: ['第一条建议', '第二条建议'] })
    await nextTick()

    // 一次只展示一条（初始为第一条）
    const items = host.querySelectorAll<HTMLElement>('.u-ai-chat__welcome-item')
    expect(items.length).toBe(1)
    expect(items[0]!.textContent).toBe('第一条建议')

    // 点击球 → 不等自动轮换，立即换下一条
    host.querySelector<HTMLElement>('.u-ai-chat__welcome canvas.u-ai-orb')!.click()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__welcome-item')?.textContent).toBe('第二条建议')
    })

    // 点击文案 → 以当前展示的文案发送；空闲欢迎立即缩小离开，列表末尾出现工作球
    host.querySelector<HTMLElement>('.u-ai-chat__welcome-item')!.click()
    await nextTick()

    expect(host.querySelector('.u-ai-chat__welcome')?.classList.contains('is-leaving')).toBe(true)
    expect(host.querySelector('.u-ai-chat__list .u-ai-chat__working')).toBeTruthy()
    const userBubble = host.querySelector('.u-ai-chat__message--user .u-ai-chat__message-bubble')
    expect(userBubble?.textContent).toContain('第二条建议')
    unmount()
  })

  it('welcome 多条时按 4s 间隔自动轮换', async () => {
    vi.useFakeTimers()
    try {
      const transport: ChatTransport = (_req, handlers) => {
        handlers.onTextDelta('收到')
      }
      const { host, unmount } = mountAiChat({ transport, welcome: ['第一条建议', '第二条建议'] })
      await nextTick()
      expect(host.querySelector('.u-ai-chat__welcome-item')?.textContent).toBe('第一条建议')

      await vi.advanceTimersByTimeAsync(4100)
      expect(host.querySelector('.u-ai-chat__welcome-item')?.textContent).toBe('第二条建议')

      // 轮换回第一条
      await vi.advanceTimersByTimeAsync(4100)
      expect(host.querySelector('.u-ai-chat__welcome-item')?.textContent).toBe('第一条建议')
      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('生成中在列表底部展示「工作中…」指示，中断后停留再消失', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'] })
    try {
      const transport: ChatTransport = (req) => {
        return new Promise<void>((resolve) => {
          req.signal.addEventListener('abort', () => resolve(), { once: true })
        })
      }
      const { host, chat, unmount } = mountAiChat({ transport })

      expect(host.querySelector('.u-ai-chat__working')).toBeFalsy()
      expect(host.querySelector('.u-ai-chat__welcome')).toBeTruthy()
      expect(host.querySelector('.u-ai-chat__list .u-ai-chat__welcome')).toBeFalsy()

      chat.value?.send('hi')
      await nextTick()

      expect(host.querySelector('.u-ai-chat__welcome')?.classList.contains('is-leaving')).toBe(true)
      const working = host.querySelector('.u-ai-chat__list .u-ai-chat__working')
      expect(working).toBeTruthy()
      expect(working?.textContent).toContain('工作中')
      const orb = working?.querySelector('canvas.u-ai-orb') as HTMLElement | null
      expect(orb).toBeTruthy()
      expect(orb?.style.width).toBe('48px')

      chat.value?.abort()
      await nextTick()
      await Promise.resolve()
      await nextTick()

      const lingering = host.querySelector('.u-ai-chat__working')
      expect(lingering).toBeTruthy()
      expect(lingering?.textContent).not.toContain('工作中')

      await vi.advanceTimersByTimeAsync(2499)
      expect(host.querySelector('.u-ai-chat__working')).toBeTruthy()
      await vi.advanceTimersByTimeAsync(2)
      await nextTick()
      // 停留结束 → 进入缩放退出过渡（is-leaving），元素仍在
      const leaving = host.querySelector('.u-ai-chat__working')
      expect(leaving).toBeTruthy()
      expect(leaving?.classList.contains('is-leaving')).toBe(true)
      // 过渡播完才卸载
      await vi.advanceTimersByTimeAsync(380)
      await nextTick()
      expect(host.querySelector('.u-ai-chat__working')).toBeFalsy()
      expect(host.querySelector('.u-ai-chat__welcome')).toBeTruthy()
      expect(host.querySelector('.u-ai-chat__list .u-ai-chat__welcome')).toBeFalsy()
      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('回答完毕后工作球停留约 2.5s 再消失', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'] })
    try {
      const transport: ChatTransport = (_req, handlers) => {
        handlers.onTextDelta('完成')
      }
      const { host, chat, unmount } = mountAiChat({ transport })

      chat.value?.send('hi')
      await nextTick()
      await Promise.resolve()
      await nextTick()

      const working = host.querySelector('.u-ai-chat__working')
      expect(working).toBeTruthy()
      expect(working?.textContent).not.toContain('工作中')
      expect(working?.querySelector('canvas.u-ai-orb')).toBeTruthy()

      await vi.advanceTimersByTimeAsync(2499)
      expect(host.querySelector('.u-ai-chat__working')).toBeTruthy()
      await vi.advanceTimersByTimeAsync(2)
      await nextTick()
      // 停留结束 → 进入缩放退出过渡（is-leaving），元素仍在
      const leaving = host.querySelector('.u-ai-chat__working')
      expect(leaving).toBeTruthy()
      expect(leaving?.classList.contains('is-leaving')).toBe(true)
      // 过渡播完才卸载
      await vi.advanceTimersByTimeAsync(380)
      await nextTick()
      expect(host.querySelector('.u-ai-chat__working')).toBeFalsy()
      expect(host.querySelector('.u-ai-chat__welcome')).toBeTruthy()
      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('对话出错后工作球停留约 2.5s 再消失', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'] })
    try {
      const transport: ChatTransport = (_req, handlers) => {
        handlers.onError?.(new Error('网络错误'))
      }
      const { host, chat, unmount } = mountAiChat({ transport })

      chat.value?.send('hi')
      await nextTick()
      await Promise.resolve()
      await nextTick()

      const working = host.querySelector('.u-ai-chat__working')
      expect(working).toBeTruthy()
      expect(working?.textContent).not.toContain('工作中')

      await vi.advanceTimersByTimeAsync(2500)
      await nextTick()
      // 停留结束 → 进入缩放退出过渡（is-leaving），元素仍在
      const leaving = host.querySelector('.u-ai-chat__working')
      expect(leaving).toBeTruthy()
      expect(leaving?.classList.contains('is-leaving')).toBe(true)
      // 过渡播完才卸载
      await vi.advanceTimersByTimeAsync(380)
      await nextTick()
      expect(host.querySelector('.u-ai-chat__working')).toBeFalsy()
      expect(host.querySelector('.u-ai-chat__welcome')).toBeTruthy()
      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('输入区提供清除入口；clear 清空后回到欢迎区', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('回复')
    }
    const { host, chat, unmount } = mountAiChat({ transport, welcome: '有什么可以帮你？' })

    expect(host.querySelector('.u-ai-chat__input-clear')).toBeTruthy()
    expect(
      host.querySelector('.u-ai-chat__input-clear-wrap')?.classList.contains('is-disabled')
    ).toBe(true)
    expect(host.querySelector('.u-ai-chat__input-usage')).toBeFalsy()

    chat.value?.send('你好')
    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('回复')
    })
    expect(
      host.querySelector('.u-ai-chat__input-clear-wrap')?.classList.contains('is-disabled')
    ).toBe(false)

    chat.value?.clear()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__welcome')?.textContent).toContain('有什么可以帮你？')
    })
    expect(host.querySelector('.md-stub')).toBeFalsy()
    unmount()
  })

  it('生成中 clear 中止请求并立即恢复欢迎区', async () => {
    const transport: ChatTransport = (req) => {
      return new Promise<void>((resolve) => {
        req.signal.addEventListener('abort', () => resolve(), { once: true })
      })
    }
    const { host, chat, unmount } = mountAiChat({ transport, welcome: '欢迎回来' })

    chat.value?.send('hi')
    await nextTick()
    expect(host.querySelector('.u-ai-chat__working')).toBeTruthy()

    chat.value?.clear()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__working')).toBeFalsy()
      expect(host.querySelector('.u-ai-chat__welcome')?.textContent).toContain('欢迎回来')
    })
    unmount()
  })

  it('有 usage 时默认只显示总 token，tokenUsageDetail 追加缓存命中/未命中', async () => {
    const usageTransport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('ok')
      handlers.onUsage?.({
        promptTokens: 10,
        completionTokens: 2,
        totalTokens: 12,
        cacheHitTokens: 4,
        cacheMissTokens: 6
      })
    }

    const compact = mountAiChat({ transport: usageTransport })
    compact.chat.value?.send('hi')
    await vi.waitFor(() => {
      expect(compact.host.querySelector('.u-ai-chat__input-usage')?.textContent).toBe('总 token 12')
    })
    expect(compact.host.querySelector('.u-ai-chat__input-usage')?.textContent).not.toContain(
      '缓存命中'
    )
    compact.unmount()

    const detail = mountAiChat({ transport: usageTransport, tokenUsageDetail: true })
    detail.chat.value?.send('hi')
    await vi.waitFor(() => {
      expect(detail.host.querySelector('.u-ai-chat__input-usage')?.textContent).toBe(
        '总 token 12 · 缓存命中 4 · 缓存未命中 6'
      )
    })
    const text = detail.host.querySelector('.u-ai-chat__input-usage')?.textContent ?? ''
    expect(text).not.toContain('本次')
    expect(text).not.toContain('累计')
    expect(text).not.toContain('输入')
    expect(text).not.toContain('输出')
    detail.unmount()
  })

  it('token 用量数字按 K/M 缩写，缓存字段缺失时不展示该项', async () => {
    const scaledTransport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('ok')
      handlers.onUsage?.({
        promptTokens: 800,
        completionTokens: 700,
        totalTokens: 1500,
        cacheHitTokens: 1000,
        cacheMissTokens: 1_000_000
      })
    }
    const scaled = mountAiChat({ transport: scaledTransport, tokenUsageDetail: true })
    scaled.chat.value?.send('hi')
    await vi.waitFor(() => {
      expect(scaled.host.querySelector('.u-ai-chat__input-usage')?.textContent).toBe(
        '总 token 1.5K · 缓存命中 1K · 缓存未命中 1M'
      )
    })
    scaled.unmount()

    const noCacheTransport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('ok')
      handlers.onUsage?.({ promptTokens: 10, completionTokens: 2, totalTokens: 12 })
    }
    const noCache = mountAiChat({ transport: noCacheTransport, tokenUsageDetail: true })
    noCache.chat.value?.send('hi')
    await vi.waitFor(() => {
      expect(noCache.host.querySelector('.u-ai-chat__input-usage')?.textContent).toBe('总 token 12')
    })
    expect(noCache.host.querySelector('.u-ai-chat__input-usage')?.textContent).not.toContain('缓存')
    noCache.unmount()
  })

  const UNKNOWN_TOOL = 'totally-unknown-tool-xyz'

  function seedUnknownCall(init: Partial<ChatToolCall> = {}) {
    const call = reactive<ChatToolCall>({
      id: 'c1',
      name: UNKNOWN_TOOL,
      arguments: '{"q":"hi"}',
      status: 'pending',
      ...init
    })
    const messages: ChatMessage[] = [
      { id: 'u1', role: 'user', content: 'go' },
      { id: 'a1', role: 'assistant', content: '', status: 'done', toolCalls: [call] }
    ]
    return { call, messages }
  }

  async function expandToolCard(host: HTMLElement) {
    const header = host.querySelector<HTMLElement>('.u-ai-chat__tool-call .u-collapse__header')
    header?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    await nextTick()
  }

  function assertGenericCard(host: HTMLElement, status: 'pending' | 'success' | 'error') {
    const card = host.querySelector(`.u-ai-chat__tool-call.is-${status}`)
    expect(card).toBeTruthy()
    expect(host.querySelector('.u-ai-chat__tool-call-name')?.textContent).toBe(UNKNOWN_TOOL)
    expect(host.querySelector('.u-ai-chat__tool-call-status')).toBeTruthy()
    expect(host.textContent).not.toContain('未找到')
  }

  it('未注册工具名 pending → success 走出通用卡片，无空白、无未找到工具文案', async () => {
    const { call, messages } = seedUnknownCall()
    const { host, unmount } = mountAiChat({ transport: () => {}, messages })
    await nextTick()

    assertGenericCard(host, 'pending')
    expect(host.querySelector('.u-ai-chat__tool-call-name')?.classList.contains('u-shine')).toBe(
      true
    )
    expect(host.textContent).toContain('"q": "hi"')

    call.status = 'success'
    call.result = '{"ok":true}'
    await nextTick()
    assertGenericCard(host, 'success')

    await expandToolCard(host)
    expect(host.textContent).toContain('"ok": true')
    unmount()
  })

  it('未注册工具名 pending → error 走出通用卡片，无空白、无未找到工具文案', async () => {
    const { call, messages } = seedUnknownCall()
    const { host, unmount } = mountAiChat({ transport: () => {}, messages })
    await nextTick()
    assertGenericCard(host, 'pending')

    call.status = 'error'
    call.error = 'boom'
    await nextTick()
    assertGenericCard(host, 'error')

    await expandToolCard(host)
    expect(host.textContent).toContain('boom')
    expect(host.textContent).toContain('错误')
    unmount()
  })

  it('通用卡片展示 view，长 JSON 可截断并展开看全文', async () => {
    const long = 'x'.repeat(500)
    const { call, messages } = seedUnknownCall({
      status: 'success',
      result: JSON.stringify({ data: long }),
      view: { kind: 'diff', body: 'patch-xyz' }
    })
    const { host, unmount } = mountAiChat({ transport: () => {}, messages })
    await nextTick()
    await expandToolCard(host)

    expect(host.textContent).toContain('视图')
    expect(host.textContent).toContain('patch-xyz')
    expect(host.textContent).not.toContain(long)
    const toggle = [
      ...host.querySelectorAll<HTMLElement>('.u-ai-chat__tool-call-json-toggle')
    ].find((el) => el.textContent?.includes('展开'))
    expect(toggle).toBeTruthy()
    toggle!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(host.textContent).toContain(long)
    unmount()
  })

  it('toolIcons 可覆盖未知名工具图标', async () => {
    const OverrideIcon = defineComponent({
      setup: () => () => h('svg', { class: 'override-tool-icon' })
    })
    const { messages } = seedUnknownCall()
    const { host, unmount } = mountAiChat({
      transport: () => {},
      messages,
      toolIcons: { [UNKNOWN_TOOL]: OverrideIcon }
    })
    await nextTick()
    expect(host.querySelector('.override-tool-icon')).toBeTruthy()
    unmount()
  })

  it('session 下不注入内置 askQuestion，无 meta 时走通用视图', async () => {
    const history: ChatSessionEvent[] = [
      {
        type: 'tool/call',
        callId: 'c1',
        name: 'askQuestion',
        arguments: '{"questions":[{"question":"Q?"}]}',
        seq: 1
      }
    ]
    const { host, unmount } = mountAiChat({
      transport: createServerTransport({
        subscribe: () => () => {},
        send: async () => {},
        cancel: async () => {},
        respond: async () => {},
        fetchHistory: async () => ({ events: history, hasMore: false }),
        selectModel: async () => {}
      })
    })
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__tool-call-name')?.textContent).toBe('askQuestion')
    })
    expect(host.querySelector('.u-ai-chat__ask-question')).toBeFalsy()
    unmount()
  })

  it('session 下 meta.render 优先于通用视图', async () => {
    const meta: ChatToolMeta = {
      name: 'server-tool',
      label: '服务端工具',
      render: defineComponent({
        props: { toolCall: { type: Object as PropType<ChatToolCall>, required: true } },
        setup: () => () => h('div', { class: 'meta-render' }, 'meta-body')
      })
    }
    const history: ChatSessionEvent[] = [
      { type: 'tool/call', callId: 'c1', name: 'server-tool', arguments: '{}', seq: 1 }
    ]
    const { host, unmount } = mountAiChat({
      transport: createServerTransport({
        subscribe: () => () => {},
        send: async () => {},
        cancel: async () => {},
        respond: async () => {},
        fetchHistory: async () => ({ events: history, hasMore: false }),
        selectModel: async () => {}
      }),
      tools: [meta]
    })
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__tool-call-name')?.textContent).toBe('服务端工具')
    })
    expect(host.querySelector('.meta-render')?.textContent).toBe('meta-body')
    expect(host.textContent).not.toContain('参数')
    unmount()
  })
})
