// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vite-plus/test'
import {
  createApp,
  defineComponent,
  h,
  nextTick,
  onUnmounted,
  reactive,
  ref,
  type Component,
  type PropType
} from 'vue'

import {
  createServerTransport,
  type ChatSessionAdapter,
  type ChatSessionEvent
} from '../../../chat/session'
import type {
  ChatMessage,
  ChatTool,
  ChatToolCall,
  ChatToolMeta,
  ChatTransport,
  ChatTransportHandlers
} from '../../../chat/types'
import type { ChatModelOption } from '../../../providers'
import type { AiChatExposed, AiChatProps } from '../../../types'
import { STREAM_THROTTLE_MS } from '../../_shared/use-stream-throttle'
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
  readonly?: boolean
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
          toolIcons: options.toolIcons,
          readonly: options.readonly
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

async function expandStepLine(host: HTMLElement) {
  await vi.waitFor(() => {
    expect(host.querySelector('.u-ai-step-group__bar')).toBeTruthy()
  })
  host.querySelector<HTMLElement>('.u-ai-step-group__bar')!.click()
  await nextTick()
}

async function waitForStepLineSettled(host: HTMLElement, count: number) {
  await vi.waitFor(() => {
    expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe(
      `执行了 ${count} 个步骤`
    )
  })
}

/** DOM 顺序断言：b 是否渲染在 a 之后 */
const isAfter = (a: Element, b: Element) =>
  !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

describe('UAiChat', () => {
  it('空状态显示欢迎语', () => {
    const { host, unmount } = mountAiChat({ transport: () => {}, welcome: '有什么可以帮你？' })

    expect(host.querySelector('.u-ai-message-list__welcome')?.textContent).toContain(
      '有什么可以帮你？'
    )
    const orb = host.querySelector(
      '.u-ai-message-list__welcome canvas.u-ai-orb'
    ) as HTMLElement | null
    expect(orb?.style.width).toBe('48px')
    expect(host.querySelector('.u-ai-message-list__scroll .u-ai-message-list__welcome')).toBeFalsy()
    unmount()
  })

  it('发送消息后渲染用户气泡与 assistant 回复', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('你好，我是助手')
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('你好')
    await nextTick()

    const userBubble = host.querySelector('.u-ai-bubble--user .u-ai-bubble__bubble')
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
      expect(host.querySelector('.u-ai-bubble__actions')).toBeTruthy()
    })

    const actions = host.querySelectorAll('.u-ai-bubble__actions .u-button')
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

    // 轮次落定后：步骤行定格为完成态摘要，过程 DOM 收进行内
    await waitForStepLineSettled(host, 1)
    expect(host.querySelector('.u-ai-tool-call')).toBeFalsy()

    await expandStepLine(host)

    expect(host.querySelector('.u-ai-tool-call__name')?.textContent).toBe('calculate')
    expect(host.querySelector('.u-ai-tool-call.is-success')).toBeTruthy()

    const header = host.querySelector<HTMLElement>('.u-ai-tool-call .u-collapse__header')!
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    await nextTick()

    const body = host.querySelector('.u-ai-tool-call .u-collapse__content-wrapper')
    // 单标量参数已被头部摘要覆盖，body 不再重复罗列；结果直接展示原始等宽文本且不含标题文本
    expect(header.textContent).toContain('1+1')
    expect(body?.textContent).toContain('{"value":2}')
    expect(body?.textContent).not.toContain('结果')
    expect(body?.textContent).not.toContain('"expression"')
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
      expect(host.querySelector('.u-ai-step-group__content')).toBeTruthy()
      expect(host.querySelector('.u-ai-tool-call__confirm')).toBeTruthy()
    })
    // 单标量参数已在头部摘要完整可见，空 body 不再自动展开
    expect(host.querySelector('.u-ai-tool-call__summary')?.textContent).toContain('/tmp/a')
    expect(host.querySelector('.u-ai-tool-call.is-active')).toBeFalsy()
    expect(execute).not.toHaveBeenCalled()

    const allowBtn = [
      ...host.querySelectorAll<HTMLElement>('.u-ai-tool-call__confirm button')
    ].find((btn) => btn.textContent?.includes('允许'))!
    allowBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    await vi.waitFor(() => {
      expect(execute).toHaveBeenCalled()
    })
    unmount()
  })

  it('awaiting-confirm 时步骤列表自动展开，手动收起后不再自动展开', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onToolCall?.({ id: 'c1', name: 'deleteFile', arguments: '{"path":"/tmp/a"}' })
    }
    const tools: ChatTool[] = [
      {
        name: 'deleteFile',
        description: '删除文件',
        parameters: {},
        needsConfirm: true,
        execute: () => ({ ok: true })
      }
    ]
    const { host, chat, unmount } = mountAiChat({ transport, tools })

    chat.value?.send('删掉 /tmp/a')

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-step-group__content')).toBeTruthy()
      expect(host.querySelector('.u-ai-tool-call__confirm')).toBeTruthy()
    })

    host.querySelector<HTMLElement>('.u-ai-step-group__bar')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-step-group__content')).toBeFalsy()
    expect(host.querySelector('.u-ai-tool-call__confirm')).toBeFalsy()
    unmount()
  })

  it('串行步骤切换时行内走马灯切换到新工具', async () => {
    let releaseSearch: (() => void) | undefined
    let releaseBash: (() => void) | undefined
    let round = 0
    const transport: ChatTransport = (_req, handlers) => {
      round++
      if (round === 1) {
        handlers.onToolCall?.({ id: 'c1', name: 'search', arguments: '{"q":"vue"}' })
        handlers.onToolCall?.({ id: 'c2', name: 'bash', arguments: '{"command":"ls"}' })
      } else {
        handlers.onTextDelta('完成')
      }
    }
    const tools: ChatTool[] = [
      {
        name: 'search',
        description: '搜索',
        parameters: {},
        // 挂起等待测试放行，控制串行执行的推进节奏
        execute: () =>
          new Promise((resolve) => {
            releaseSearch = () => resolve({ hits: 1 })
          })
      },
      {
        name: 'bash',
        description: '执行命令',
        parameters: {},
        execute: () =>
          new Promise((resolve) => {
            releaseBash = () => resolve('ok')
          })
      }
    ]
    const { host, chat, unmount } = mountAiChat({ transport, tools })

    chat.value?.send('搜一下再执行')

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('search')
    })
    expect(host.querySelector('.u-ai-step-group__count')?.textContent).toBe('2 步')

    // 第一个工具落定后：行内切换展示第二个工具（第二个仍挂起，行内保持其实时视图）
    releaseSearch?.()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('bash')
    })
    releaseBash?.()
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

    await expandStepLine(host)

    expect(host.querySelector('.u-ai-tool-call__name')?.textContent).toBe('搜索')
    expect(host.querySelector('.custom-tool-icon')).toBeTruthy()
    unmount()
  })

  const createResultView = (className: string) =>
    defineComponent({
      props: { toolCall: { type: Object as PropType<ChatToolCall>, required: true } },
      setup(props) {
        return () => h('div', { class: className }, `result:${props.toolCall.result ?? ''}`)
      }
    })

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

  it('render 自定义渲染替换卡片 body，完成后默认折叠、展开后可见', async () => {
    const tools = [weatherTool({ render: createResultView('weather-view') })]
    const { host, chat, unmount } = mountAiChat({ transport: createWeatherTransport(), tools })

    chat.value?.send('北京天气')

    // 最终答案输出后工具卡片收进步骤行，展开后断言
    await waitForStepLineSettled(host, 1)
    await expandStepLine(host)

    // render 工具完成后默认折叠（不再是保持展开）
    expect(host.querySelector('.u-ai-tool-call.is-success')).toBeTruthy()
    expect(host.querySelector('.u-ai-tool-call.is-active')).toBeFalsy()

    const header = host.querySelector<HTMLElement>('.u-ai-tool-call .u-collapse__header')!
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    await nextTick()
    expect(host.querySelector('.weather-view')?.textContent).toContain('{"temperature":26}')
    expect(host.querySelector('.u-ai-tool-call__data')).toBeFalsy()
    unmount()
  })

  it('terminal + render 的「UI 即答复」工具完成后保持展开', async () => {
    const tools = [weatherTool({ render: createResultView('weather-view'), terminal: true })]
    const { host, chat, unmount } = mountAiChat({ transport: createWeatherTransport(), tools })

    chat.value?.send('北京天气')

    // 终结工具成功即结束对话（无第二轮文本）：展开步骤行后，答复卡片保持展开
    await waitForStepLineSettled(host, 1)
    await expandStepLine(host)
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-tool-call.is-success.is-active')).toBeTruthy()
    })
    expect(host.querySelector('.weather-view')?.textContent).toContain('{"temperature":26}')
    // 无正文答案的终结轮：操作区（重新生成）落在尾部状态载体上，不随步骤压缩丢失
    expect(host.querySelector('.u-ai-bubble__actions [title="重新生成"]')).toBeTruthy()
    unmount()
  })

  it('renderTo: reply 的卡片渲染在回复流，落定后不随步骤行折叠', async () => {
    const tools = [
      weatherTool({ render: createResultView('weather-view'), renderTo: 'reply', terminal: true })
    ]
    const { host, chat, unmount } = mountAiChat({ transport: createWeatherTransport(), tools })

    chat.value?.send('北京天气')

    // 轮次落定（步骤行收起为完成态摘要）后，卡片仍常驻回复流——不展开步骤行即可见
    await waitForStepLineSettled(host, 1)
    await vi.waitFor(() => {
      expect(
        host.querySelector('.u-ai-message-list__reply-tool .weather-view')?.textContent
      ).toContain('result:{"temperature":26}')
    })

    // 步骤行仍保留过程条目：展开后是默认参数/结果视图，不重复渲染自定义卡片
    await expandStepLine(host)
    expect(host.querySelector('.u-ai-step-group__content .u-ai-tool-call')).toBeTruthy()
    expect(host.querySelector('.u-ai-step-group__content .weather-view')).toBeFalsy()

    // 无正文答案的终结轮：操作区（重新生成）仍落在尾部状态载体上
    expect(host.querySelector('.u-ai-bubble__actions [title="重新生成"]')).toBeTruthy()
    unmount()
  })

  it('renderTo: reply 的卡片 live 期间实时渲染在回复流', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onToolCall?.({ id: 'c1', name: 'getWeather', arguments: '{"city":"北京"}' })
    }
    const tools = [
      weatherTool({
        render: createResultView('weather-view'),
        renderTo: 'reply',
        // execute 挂起：停留在 running，验证 live 期回复流卡片常驻
        execute: () => new Promise(() => {})
      })
    ]
    const { host, chat, unmount } = mountAiChat({ transport, tools })

    chat.value?.send('北京天气')

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-message-list__reply-tool .weather-view')).toBeTruthy()
    })
    expect(host.querySelector('.u-ai-step-group__title')?.textContent).toContain('getWeather')
    unmount()
  })

  it('天气工具执行中点击停止按钮后，立即退出运行态并清除扫光效果', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onToolCall?.({ id: 'c1', name: 'getWeather', arguments: '{"city":"北京"}' })
    }
    const tools = [
      weatherTool({
        render: createResultView('weather-view'),
        renderTo: 'reply',
        terminal: true,
        execute: () => new Promise(() => {})
      })
    ]
    const { host, chat, unmount } = mountAiChat({ transport, tools })

    chat.value?.send('北京天气')

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-message-list__reply-tool .weather-view')).toBeTruthy()
      expect(host.querySelector('.u-ai-step-group__title.u-shine')).toBeTruthy()
      expect(host.querySelector('button[title="停止生成"]')).toBeTruthy()
    })

    click(host.querySelector<HTMLElement>('button[title="停止生成"]')!)

    await vi.waitFor(() => {
      expect(host.querySelector('button[title="停止生成"]')).toBeFalsy()
      expect(host.querySelector('.u-ai-step-group.is-settled')).toBeTruthy()
      expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('已停止')
    })

    expect(host.querySelector('.u-ai-step-group__title.u-shine')).toBeFalsy()
    expect(host.querySelector('.u-ai-bubble__status')?.textContent?.trim()).toBe('已停止生成')

    await expandStepLine(host)
    expect(host.querySelector('.u-ai-tool-call.is-error')).toBeTruthy()
    expect(host.querySelector('.u-ai-tool-call__name.u-shine')).toBeFalsy()
    unmount()
  })

  it('renderTo: reply 未提供 render 时兜底标准工具卡片', async () => {
    const tools = [weatherTool({ renderTo: 'reply' })]
    const { host, chat, unmount } = mountAiChat({ transport: createWeatherTransport(), tools })

    chat.value?.send('北京天气')

    await waitForStepLineSettled(host, 1)
    await vi.waitFor(() => {
      expect(
        host.querySelector('.u-ai-message-list__reply-tool .u-ai-tool-call.is-success')
      ).toBeTruthy()
    })
    unmount()
  })

  it('同一消息思考 + 正文 + askQuestion：未记录 offset 时提问面板在正文之后', async () => {
    const messages: ChatMessage[] = [
      { id: 'u1', role: 'user', content: '帮我建模' },
      {
        id: 'a1',
        role: 'assistant',
        reasoning: '先想想用什么库',
        content: '我先确认几个关键取舍',
        toolCalls: [
          {
            id: 'q1',
            name: 'askQuestion',
            arguments: JSON.stringify({ questions: [{ question: '用哪种数据库？' }] }),
            status: 'pending'
          }
        ],
        status: 'done'
      }
    ]
    const { host, unmount } = mountAiChat({ transport: () => {}, messages })
    await nextTick()

    // 同一条消息不拆成两段步骤行：思考仍在步骤行，提问卡片跟在正文后面
    expect(host.querySelectorAll('.u-ai-step-group')).toHaveLength(1)
    const stepLine = host.querySelector('.u-ai-step-group')!
    const panel = host.querySelector('.u-ai-message-list__reply-tool')!
    const answer = host.querySelector('.md-stub')!
    expect(panel.querySelector('.u-ai-question-card__q')?.textContent).toContain('用哪种数据库？')
    expect(answer.textContent).toContain('我先确认几个关键取舍')
    expect(isAfter(stepLine, answer)).toBe(true)
    expect(isAfter(answer, panel)).toBe(true)
    unmount()
  })

  it('多轮追问：每轮提问面板跟在本轮正文之后，不串到上一轮', async () => {
    const askCall = (
      id: string,
      question: string,
      init: Partial<ChatToolCall> = {}
    ): ChatToolCall => ({
      id,
      name: 'askQuestion',
      arguments: JSON.stringify({ questions: [{ question }] }),
      status: 'pending',
      ...init
    })
    const messages: ChatMessage[] = [
      { id: 'u1', role: 'user', content: '帮我建模' },
      {
        id: 'a1',
        role: 'assistant',
        reasoning: '想一想',
        content: '先确认取舍',
        toolCalls: [
          askCall('q1', '用哪种数据库？', {
            status: 'success',
            result: JSON.stringify({
              answers: [{ question: '用哪种数据库？', answer: 'PostgreSQL' }]
            })
          })
        ],
        status: 'done'
      },
      {
        id: 'a2',
        role: 'assistant',
        reasoning: '再想想',
        content: '再确认一个',
        toolCalls: [askCall('q2', '要初始数据吗？')],
        status: 'streaming'
      }
    ]
    const { host, unmount } = mountAiChat({ transport: () => {}, messages })
    await nextTick()

    const bars = [...host.querySelectorAll('.u-ai-step-group')]
    const panels = [...host.querySelectorAll('.u-ai-message-list__reply-tool')]
    const answers = [...host.querySelectorAll('.md-stub')]
    expect(bars).toHaveLength(2)
    expect(panels[0]!.querySelector('.u-ai-question-card__result')?.textContent).toContain(
      'PostgreSQL'
    )
    expect(panels[1]!.querySelector('.u-ai-question-card__q')?.textContent).toContain(
      '要初始数据吗？'
    )
    expect(isAfter(bars[0]!, answers[0]!)).toBe(true)
    expect(isAfter(answers[0]!, panels[0]!)).toBe(true)
    expect(isAfter(panels[0]!, bars[1]!)).toBe(true)
    expect(isAfter(bars[1]!, answers[1]!)).toBe(true)
    expect(isAfter(answers[1]!, panels[1]!)).toBe(true)
    unmount()
  })

  it('流式追问：正文之后到达的 askQuestion 面板留在正文之后', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onReasoningDelta?.('先分析需求')
      handlers.onTextDelta('我先确认几个关键取舍')
      handlers.onToolCall?.({
        id: 'q1',
        name: 'askQuestion',
        arguments: JSON.stringify({ questions: [{ question: '用哪种数据库？' }] })
      })
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('帮我建模')

    // 工具调用在正文之后到达同一条消息：面板留在这段正文之后
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('用哪种数据库？')
    })
    const stepLine = host.querySelector('.u-ai-step-group')!
    const panel = host.querySelector('.u-ai-message-list__reply-tool')!
    const answer = host.querySelector('.md-stub')!
    expect(isAfter(stepLine, answer)).toBe(true)
    expect(isAfter(answer, panel)).toBe(true)
    unmount()
  })

  it('流式追问：正文之前到达的 askQuestion 留在随后写出的正文前面', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onToolCall?.({
        id: 'q1',
        name: 'askQuestion',
        arguments: JSON.stringify({ questions: [{ question: '用哪种数据库？' }] })
      })
      handlers.onTextDelta('补充说明')
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('帮我建模')

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('用哪种数据库？')
      expect(host.querySelector('.md-stub')?.textContent).toContain('补充说明')
    })
    const panel = host.querySelector('.u-ai-message-list__reply-tool')!
    const answer = host.querySelector('.md-stub')!
    expect(isAfter(panel, answer)).toBe(true)
    unmount()
  })

  it('流式追问：正文写到一半到达的 askQuestion 留在前后文之间', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('先说一句')
      handlers.onToolCall?.({
        id: 'q1',
        name: 'askQuestion',
        arguments: JSON.stringify({ questions: [{ question: '用哪种数据库？' }] })
      })
      handlers.onTextDelta('再补充')
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('帮我建模')

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('用哪种数据库？')
    })
    const bubble = host.querySelector('.u-ai-bubble--assistant')!
    const stubs = [...bubble.querySelectorAll('.md-stub')]
    const panel = bubble.querySelector('.u-ai-message-list__reply-tool')!
    expect(stubs.map((el) => el.textContent)).toEqual(['先说一句', '再补充'])
    expect(isAfter(stubs[0]!, panel)).toBe(true)
    expect(isAfter(panel, stubs[1]!)).toBe(true)
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

    await expandStepLine(host)

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-tool-call.is-success.is-active')).toBeTruthy()
    })
    expect(
      host.querySelector('.u-ai-tool-call .u-collapse__content-wrapper')?.textContent
    ).toContain('2')
    unmount()
  })

  it('render 工具设置 autoCollapse: true 后完成即折叠', async () => {
    const tools = [weatherTool({ render: createResultView('weather-view'), autoCollapse: true })]
    const { host, chat, unmount } = mountAiChat({ transport: createWeatherTransport(), tools })

    chat.value?.send('北京天气')

    await waitForStepLineSettled(host, 1)
    await expandStepLine(host)

    expect(host.querySelector('.u-ai-tool-call.is-success')).toBeTruthy()
    expect(host.querySelector('.u-ai-tool-call.is-active')).toBeFalsy()
    const body = host.querySelector('.u-ai-tool-call .u-collapse__content-wrapper')
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

    await waitForStepLineSettled(host, 1)
    await expandStepLine(host)

    // 完成后自动折叠：内容 DOM 已卸载（减少内存与渲染成本），包装容器保留
    expect(host.querySelector('.u-ai-tool-call.is-active')).toBeFalsy()
    expect(host.querySelector('.u-ai-tool-call .u-collapse__content')).toBeFalsy()
    expect(host.querySelector('.u-ai-tool-call .u-collapse__content-wrapper')).toBeTruthy()

    const header = host.querySelector<HTMLElement>('.u-ai-tool-call .u-collapse__header')!
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    await nextTick()
    expect(host.querySelector('.u-ai-tool-call .u-collapse__content')?.textContent).toContain('2')
    unmount()
  })

  it('思考中步骤行显示「思考中…」与最新一行思考，展开可见思考块', async () => {
    // 由测试手动推进流式节奏，避免断言竞态
    const steps: (() => void)[] = []
    const transport: ChatTransport = async (_req, handlers) => {
      handlers.onReasoningDelta?.('第一行思考')
      await new Promise<void>((resolve) => steps.push(resolve))
      handlers.onReasoningDelta?.('\n\n第二行思考')
      await new Promise<void>((resolve) => steps.push(resolve))
      handlers.onTextDelta('答案')
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('hi')

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('思考中…')
    })
    expect(host.querySelector('.u-ai-step-group__text')?.textContent).toBe('第一行思考')
    expect(host.querySelector('.u-ai-reasoning')).toBeFalsy()

    // 流式推进后滚动到最新一行（跳过空行）
    await vi.waitFor(() => {
      expect(steps.length).toBeGreaterThan(0)
    })
    steps.shift()?.()
    // 节流刷新走真实 50ms 定时器；CI 122 worker 并行 + lint 抢核时事件循环
    // 可能整体停滞数秒，给足超时余量
    await vi.waitFor(
      () => {
        expect(host.querySelector('.u-ai-step-group__text')?.textContent).toBe('第二行思考')
      },
      { timeout: 10000 }
    )

    // 展开步骤行：思考块可见（自身默认折叠）
    host.querySelector<HTMLElement>('.u-ai-step-group__bar')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-reasoning__title')?.textContent).toContain('思考中')
    expect(host.querySelector('.u-ai-reasoning__content')).toBeFalsy()

    // 正文开始输出：该段闭合，行定格为完成态摘要，不再滚动展示思考行
    await vi.waitFor(() => {
      expect(steps.length).toBeGreaterThan(0)
    })
    steps.shift()?.()
    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('答案')
    })
    // 落定渲染与正文渲染可能相差一拍（慢速 CI 尤甚），轮询等待而非同步断言
    await waitForStepLineSettled(host, 1)
    expect(host.querySelector('.u-ai-step-group__text')).toBeFalsy()
    unmount()
  })

  it('思考过程流式结束后步骤行收起，展开可见思考块', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onReasoningDelta?.('先分析一下问题')
      handlers.onTextDelta('答案')
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('hi')

    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('答案')
    })

    // 落定后：行定格为完成态摘要，思考块随列表收起而卸载
    expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('执行了 1 个步骤')
    expect(host.querySelector('.u-ai-reasoning')).toBeFalsy()

    host.querySelector<HTMLElement>('.u-ai-step-group__bar')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-reasoning__title')?.textContent).toContain('思考过程')
    expect(host.querySelector('.u-ai-reasoning__content')).toBeFalsy()
    host.querySelector<HTMLElement>('.u-ai-reasoning__header')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-reasoning__text')?.textContent).toContain('先分析一下问题')
    unmount()
  })

  it('思考耗时跨折叠卸载重挂载保留：重展开始终显示「思考了 Ns」', async () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date']
    })
    try {
      const steps: (() => void)[] = []
      const transport: ChatTransport = async (_req, handlers) => {
        handlers.onReasoningDelta?.('认真想一想')
        await new Promise<void>((resolve) => steps.push(resolve))
        handlers.onTextDelta('答案')
      }
      const { host, chat, unmount } = mountAiChat({ transport })

      chat.value?.send('hi')
      await vi.waitFor(() => {
        expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('思考中…')
      })

      host.querySelector<HTMLElement>('.u-ai-step-group__bar')!.click()
      await nextTick()
      expect(host.querySelector('.u-ai-reasoning__title')?.textContent).toBe('思考中…')

      // 思考持续超过 1s 后正文开始，思考结束、该段闭合
      await vi.advanceTimersByTimeAsync(1500)
      steps.shift()?.()
      await vi.waitFor(() => {
        expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('执行了 1 个步骤')
      })
      expect(host.querySelector('.u-ai-reasoning__title')?.textContent).toBe('思考了 2s')

      // 收起（卸载思考块）再展开（重挂载新实例）：耗时按消息 id 模块级记忆，不回落「思考过程」
      host.querySelector<HTMLElement>('.u-ai-step-group__bar')!.click()
      await nextTick()
      expect(host.querySelector('.u-ai-reasoning')).toBeFalsy()
      host.querySelector<HTMLElement>('.u-ai-step-group__bar')!.click()
      await nextTick()
      expect(host.querySelector('.u-ai-reasoning__title')?.textContent).toBe('思考了 2s')
      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('段闭合瞬间步骤列表保持展开：段 key 不因首条 content 到达翻转', async () => {
    let round = 0
    const steps: (() => void)[] = []
    let releaseAnswer: (() => void) | undefined
    const transport: ChatTransport = async (_req, handlers) => {
      round++
      if (round === 1) {
        handlers.onToolCall?.({ id: 'c1', name: 'calculate', arguments: '{"expression":"1+1"}' })
      } else {
        // 正文开始前挂起：留出手动展开步骤列表的时间窗
        await new Promise<void>((resolve) => steps.push(resolve))
        handlers.onTextDelta('答案是 2')
        await new Promise<void>((resolve) => {
          releaseAnswer = resolve
        })
      }
    }
    const tools: ChatTool[] = [
      { name: 'calculate', description: '计算', parameters: {}, execute: () => ({ value: 2 }) }
    ]
    const { host, chat, unmount } = mountAiChat({ transport, tools })

    chat.value?.send('1+1 等于几')

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('calculate')
    })

    host.querySelector<HTMLElement>('.u-ai-step-group__bar')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-step-group__content')).toBeTruthy()

    // 首条 content 到达、该段闭合：段不重挂（key 稳定），列表保持展开
    steps.shift()?.()
    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('答案是 2')
    })
    expect(host.querySelector('.u-ai-step-group__content')).toBeTruthy()
    expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('执行了 1 个步骤')

    releaseAnswer?.()
    unmount()
  })

  it('轮次落定后步骤行定格为「执行了 N 个步骤」，展开可见思考块与工具卡片', async () => {
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

    await waitForStepLineSettled(host, 2)
    expect(host.querySelector('.u-ai-step-group__count')?.textContent).toBe('2 步')
    expect(host.querySelector('.u-ai-tool-call')).toBeFalsy()
    expect(host.querySelector('.u-ai-reasoning')).toBeFalsy()
    expect(host.querySelector('.md-stub')?.textContent).toContain('答案是 2')

    host.querySelector<HTMLElement>('.u-ai-step-group__bar')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-reasoning__title')?.textContent).toContain('思考过程')
    expect(host.querySelector('.u-ai-reasoning__content')).toBeFalsy()
    expect(host.querySelector('.u-ai-tool-call__name')?.textContent).toBe('calculate')

    host.querySelector<HTMLElement>('.u-ai-step-group__bar')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-step-group__content')).toBeFalsy()
    expect(host.querySelector('.u-ai-tool-call')).toBeFalsy()
    unmount()
  })

  it('文字回答开始即闭合该段：最终答案流式中步骤行已定格为完成态', async () => {
    let round = 0
    let releaseAnswer: (() => void) | undefined
    const transport: ChatTransport = async (_req, handlers) => {
      round++
      if (round === 1) {
        handlers.onToolCall?.({ id: 'c1', name: 'calculate', arguments: '{"expression":"1+1"}' })
      } else {
        handlers.onTextDelta('答案是 2')
        await new Promise<void>((resolve) => {
          releaseAnswer = resolve
        })
      }
    }
    const tools: ChatTool[] = [
      { name: 'calculate', description: '计算', parameters: {}, execute: () => ({ value: 2 }) }
    ]
    const { host, chat, unmount } = mountAiChat({ transport, tools })

    chat.value?.send('1+1 等于几')

    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('答案是 2')
    })
    expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('执行了 1 个步骤')

    releaseAnswer?.()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('执行了 1 个步骤')
    })
    unmount()
  })

  it('中间文本分段：同一条消息 content + toolCalls 拆成两段两行', async () => {
    const messages: ChatMessage[] = [
      { id: 'u1', role: 'user', content: '先介绍再执行' },
      {
        id: 'a1',
        role: 'assistant',
        content: '',
        reasoning: '想一想',
        toolCalls: [{ id: 'c0', name: 'bash', arguments: '{}', status: 'success' }],
        status: 'done'
      },
      {
        id: 'a2',
        role: 'assistant',
        content: '先介绍一下',
        toolCalls: [{ id: 'c1', name: 'search', arguments: '{"q":"x"}', status: 'success' }],
        status: 'done'
      }
    ]
    const { host, unmount } = mountAiChat({ transport: () => {}, messages })
    await nextTick()

    // 两个步骤行：第一段（思考 + 前置工具）在回答前，第二段（回答后的工具）另起一行
    const bars = [...host.querySelectorAll('.u-ai-step-group')]
    expect(bars).toHaveLength(2)
    expect(bars[0]?.querySelector('.u-ai-step-group__title')?.textContent).toBe('执行了 2 个步骤')
    expect(bars[1]?.querySelector('.u-ai-step-group__title')?.textContent).toBe('执行了 1 个步骤')
    expect(host.querySelector('.md-stub')?.textContent).toContain('先介绍一下')
    expect(
      bars[0].compareDocumentPosition(host.querySelector('.md-stub')!) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      host.querySelector('.md-stub')!.compareDocumentPosition(bars[1]) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    unmount()
  })

  it('单轮纯文本对话不出现步骤行', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('你好')
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('hi')
    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('你好')
    })
    expect(host.querySelector('.u-ai-step-group')).toBeFalsy()
    unmount()
  })

  it('思考图标在思考中带 is-active，结束后恢复静止', async () => {
    const steps: (() => void)[] = []
    const transport: ChatTransport = async (_req, handlers) => {
      handlers.onReasoningDelta?.('想一下')
      await new Promise<void>((resolve) => steps.push(resolve))
      handlers.onTextDelta('答案')
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('hi')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-thinking-icon.is-active')).toBeTruthy()
    })

    steps.shift()?.()
    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('答案')
    })
    expect(host.querySelector('.u-ai-thinking-icon.is-active')).toBeFalsy()
    unmount()
  })

  /** 让消息列表进入可滚状态：stub 高度（含窄屏宽度，验证不受列宽限制）并触发一次滚动事件 */
  async function makeScrollable(host: HTMLElement, width = 480) {
    const container = host.querySelector<HTMLElement>(
      '.u-ai-message-list__scroll .u-scroll__container'
    )!
    Object.defineProperty(container, 'clientWidth', { value: width, configurable: true })
    Object.defineProperty(container, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true })
    container.dispatchEvent(new Event('scroll'))
    await nextTick()
    await nextTick()
  }

  it('会话不足 3 轮不出现导航，达到后可滚动即渲染圆点且 hover 单点显示该轮问答前缀', async () => {
    const transport: ChatTransport = (_req, handlers) =>
      handlers.onTextDelta('这是对应这一轮的回答前缀内容')
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('第一轮提问')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-bubble--user')).toBeTruthy()
    })
    expect(host.querySelector('.u-ai-session-nav')).toBeFalsy()

    chat.value?.send('第二轮提问')
    chat.value?.send('第三轮提问')
    await vi.waitFor(() => {
      expect(host.querySelectorAll('[data-turn]')).toHaveLength(3)
    })
    // 内容未溢出时不需要导航
    expect(host.querySelector('.u-ai-session-nav')).toBeFalsy()

    await makeScrollable(host)
    await vi.waitFor(() => {
      expect(host.querySelectorAll('.u-ai-session-nav__dot')).toHaveLength(3)
    })

    // 激活圆点带 is-active（happy-dom 无布局，视口判定落在最后一轮），其前的圆点已读变淡
    const dots = [...host.querySelectorAll('.u-ai-session-nav__dot')]
    expect(dots[2]!.classList.contains('is-active')).toBe(true)
    expect(dots[0]!.classList.contains('is-read')).toBe(true)

    const firstItem = host.querySelectorAll<HTMLElement>('.u-ai-session-nav__item')[0]!
    firstItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }))
    await nextTick()
    const tooltips = host.querySelectorAll('.u-ai-session-nav__tooltip')
    expect(tooltips).toHaveLength(1)
    expect(tooltips[0]!.textContent).toContain('第一轮提问')
    expect(tooltips[0]!.textContent).toContain('这是对应这一轮的回答前缀内容')
    expect(tooltips[0]!.textContent).not.toContain('第二轮提问')

    firstItem.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }))
    await nextTick()
    expect(host.querySelectorAll('.u-ai-session-nav__tooltip')).toHaveLength(0)
    unmount()
  })

  it('点击圆点滚到对应轮次', async () => {
    const transport: ChatTransport = (_req, handlers) => handlers.onTextDelta('收到')
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('第一轮')
    chat.value?.send('第二轮')
    chat.value?.send('第三轮')
    await vi.waitFor(() => {
      expect(host.querySelectorAll('[data-turn]')).toHaveLength(3)
    })
    await makeScrollable(host)

    const turns = [...host.querySelectorAll<HTMLElement>('[data-turn]')]
    const container = host.querySelector<HTMLElement>(
      '.u-ai-message-list__scroll .u-scroll__container'
    )!
    const scrolled: number[] = []
    container.scrollTo = ((options: ScrollToOptions) => {
      scrolled.push(options.top ?? 0)
    }) as typeof container.scrollTo

    host.querySelectorAll<HTMLElement>('.u-ai-session-nav__dot')[1]!.click()
    await nextTick()
    // 跳到第二轮：happy-dom 无布局，目标与容器顶同为 0，只需确认发生了滚动且指向该轮
    expect(scrolled).toHaveLength(1)
    expect(turns[1]).toBeTruthy()
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
    expect(host.querySelector('.u-ai-message-list__to-latest')).toBeFalsy()

    const container = host.querySelector<HTMLElement>(
      '.u-ai-message-list__scroll .u-scroll__container'
    )!
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: -120, bubbles: true }))
    await nextTick()
    expect(host.querySelector('.u-ai-message-list__to-latest')).toBeTruthy()

    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('第二段')
    })
    expect(host.querySelector('.u-ai-message-list__to-latest')).toBeTruthy()
    unmount()
  })

  it('高速流式输出经 throttle 节流：首块立即渲染，窗口内合并抑制，到期与收尾补齐最新内容', async () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date']
    })
    try {
      let handlers: ChatTransportHandlers | undefined
      let finish!: () => void
      const transport: ChatTransport = (_req, h) => {
        handlers = h
        return new Promise<void>((resolve) => {
          finish = resolve
        })
      }
      const { host, chat, unmount } = mountAiChat({ transport })

      const container = host.querySelector<HTMLElement>(
        '.u-ai-message-list__scroll .u-scroll__container'
      )!
      const scrollSpy = vi.spyOn(container, 'scrollTo').mockImplementation(() => {})

      chat.value?.send('hi')
      await nextTick()
      await nextTick()
      scrollSpy.mockClear()

      handlers!.onTextDelta('首块')
      await nextTick()
      await nextTick()
      expect(host.querySelector('.md-stub')?.textContent).toBe('首块')
      expect(scrollSpy).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(10)
      handlers!.onTextDelta('中1')
      await nextTick()
      await vi.advanceTimersByTimeAsync(10)
      handlers!.onTextDelta('中2')
      await nextTick()
      await nextTick()
      expect(host.querySelector('.md-stub')?.textContent).toBe('首块')
      expect(scrollSpy).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(STREAM_THROTTLE_MS)
      handlers!.onTextDelta('续')
      await nextTick()
      await nextTick()
      expect(host.querySelector('.md-stub')?.textContent).toBe('首块中1中2续')
      expect(scrollSpy).toHaveBeenCalledTimes(2)

      await vi.advanceTimersByTimeAsync(10)
      handlers!.onTextDelta('尾')
      await nextTick()
      expect(host.querySelector('.md-stub')?.textContent).toBe('首块中1中2续')

      finish()
      await Promise.resolve()
      await nextTick()
      await nextTick()
      expect(host.querySelector('.md-stub')?.textContent).toBe('首块中1中2续尾')

      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('高速思考流式输出经 throttle 节流：行内最新一行思考合并刷新，结束后正常落定', async () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date']
    })
    try {
      let handlers: ChatTransportHandlers | undefined
      let finish!: () => void
      const transport: ChatTransport = (_req, h) => {
        handlers = h
        return new Promise<void>((resolve) => {
          finish = resolve
        })
      }
      const { host, chat, unmount } = mountAiChat({ transport })

      chat.value?.send('hi')
      await nextTick()

      handlers!.onReasoningDelta?.('思考1')
      await nextTick()
      expect(host.querySelector('.u-ai-step-group__text')?.textContent).toBe('思考1')

      await vi.advanceTimersByTimeAsync(10)
      handlers!.onReasoningDelta?.('\n思考2')
      await nextTick()
      await vi.advanceTimersByTimeAsync(10)
      handlers!.onReasoningDelta?.('\n思考3')
      await nextTick()
      expect(host.querySelector('.u-ai-step-group__text')?.textContent).toBe('思考1')

      await vi.advanceTimersByTimeAsync(STREAM_THROTTLE_MS)
      handlers!.onReasoningDelta?.('\n思考4')
      await nextTick()
      expect(host.querySelector('.u-ai-step-group__text')?.textContent).toBe('思考4')

      handlers!.onTextDelta('最终答案')
      finish()
      await vi.waitFor(() => {
        expect(host.querySelector('.md-stub')?.textContent).toBe('最终答案')
        expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('执行了 1 个步骤')
      })

      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('render 优先于 tool-<name> 插槽', async () => {
    const tools = [weatherTool({ render: createResultView('weather-view') })]
    const { host, chat, unmount } = mountAiChat({
      transport: createWeatherTransport(),
      tools,
      slots: { 'tool-getWeather': () => h('div', { class: 'slot-view' }, 'slot') }
    })

    chat.value?.send('北京天气')

    await expandStepLine(host)

    expect(host.querySelector('.u-ai-tool-call.is-success')).toBeTruthy()

    const header = host.querySelector<HTMLElement>('.u-ai-tool-call .u-collapse__header')!
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    await nextTick()
    expect(host.querySelector('.weather-view')).toBeTruthy()
    expect(host.querySelector('.slot-view')).toBeFalsy()
    unmount()
  })

  const createArgsView = (className: string) =>
    defineComponent({
      props: { toolCall: { type: Object as PropType<ChatToolCall>, required: true } },
      setup(props) {
        return () => h('div', { class: className }, `args:${props.toolCall.arguments}`)
      }
    })

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

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-side-panel .page-view')).toBeTruthy()
    })
    expect(host.querySelector('.u-ai-side-panel__title')?.textContent).toBe('后台页面')

    await expandStepLine(host)

    expect(host.querySelector('.u-ai-tool-call.is-success')).toBeTruthy()
    expect(host.querySelector('.u-ai-tool-call .page-view')).toBeFalsy()
    expect(host.querySelector('.u-ai-tool-call__panel-entry')).toBeTruthy()
    unmount()
  })

  it('面板可关闭，点击工具卡片入口重新打开', async () => {
    const tools = [pageTool({ render: createResultView('page-view'), renderTo: 'panel' })]
    const { host, chat, unmount } = mountAiChat({ transport: createPageTransport(), tools })

    chat.value?.send('打开表单页')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-side-panel')).toBeTruthy()
    })

    host.querySelector<HTMLElement>('.u-ai-side-panel__close')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-side-panel')).toBeFalsy()

    await expandStepLine(host)

    const entryBtn = [
      ...host.querySelectorAll<HTMLElement>('.u-ai-tool-call__panel-entry button')
    ].find((btn) => btn.textContent?.includes('查看面板'))!
    entryBtn.click()
    await nextTick()
    expect(host.querySelector('.u-ai-side-panel .page-view')).toBeTruthy()
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

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-side-panel .page-view')?.textContent).toContain('list')
    })

    await expandStepLine(host)

    const firstCard = host.querySelectorAll<HTMLElement>('.u-ai-tool-call')[0]!
    const entryBtn = [
      ...firstCard.querySelectorAll<HTMLElement>('.u-ai-tool-call__panel-entry button')
    ].find((btn) => btn.textContent?.includes('查看面板'))!
    entryBtn.click()
    await nextTick()
    expect(host.querySelector('.u-ai-side-panel .page-view')?.textContent).toContain('form')
    unmount()
  })

  it('面板与会话区经 ULayout 列轨分隔并渲染拖拽手柄', async () => {
    const tools = [pageTool({ render: createResultView('page-view'), renderTo: 'panel' })]
    const { host, chat, unmount } = mountAiChat({ transport: createPageTransport(), tools })

    chat.value?.send('打开表单页')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-side-panel')).toBeTruthy()
    })

    // 面板默认宽：容器宽度未知（测试环境 clientWidth 为 0）时回退 420px，ULayout 渲染列间拖拽手柄
    const layout = host.querySelector<HTMLElement>('.u-ai-chat')!
    expect(layout.style.gridTemplateColumns).toBe('1fr 420px')
    expect(host.querySelector('.u-layout__resizer')).toBeTruthy()

    host.querySelector<HTMLElement>('.u-ai-side-panel__close')!.click()
    await vi.waitFor(() => {
      expect(layout.style.gridTemplateColumns).toBe('1fr')
      expect(host.querySelector('.u-layout__resizer')).toBeFalsy()
    })
    unmount()
  })

  it('未指定 panelWidth 时面板打开默认平分容器宽度', async () => {
    const tools = [pageTool({ render: createResultView('page-view'), renderTo: 'panel' })]
    const { host, chat, unmount } = mountAiChat({ transport: createPageTransport(), tools })

    const layout = host.querySelector<HTMLElement>('.u-ai-chat')!
    Object.defineProperty(layout, 'clientWidth', { value: 1200, configurable: true })

    chat.value?.send('打开表单页')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-side-panel')).toBeTruthy()
    })

    expect(layout.style.gridTemplateColumns).toBe('1fr 600px')
    unmount()
  })

  it('面板工具可通过 panelWidth 指定默认宽度', async () => {
    const tools = [
      pageTool({ render: createResultView('page-view'), renderTo: 'panel', panelWidth: 480 })
    ]
    const { host, chat, unmount } = mountAiChat({ transport: createPageTransport(), tools })

    chat.value?.send('打开表单页')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-side-panel')).toBeTruthy()
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

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-side-panel .report-view')).toBeTruthy()
    })
    const layout = host.querySelector<HTMLElement>('.u-ai-chat')!
    expect(layout.style.gridTemplateColumns).toBe('1fr 640px')

    await expandStepLine(host)

    const firstCard = host.querySelectorAll<HTMLElement>('.u-ai-tool-call')[0]!
    const entryBtn = [
      ...firstCard.querySelectorAll<HTMLElement>('.u-ai-tool-call__panel-entry button')
    ].find((btn) => btn.textContent?.includes('查看面板'))!
    entryBtn.click()
    await nextTick()
    expect(host.querySelector('.u-ai-side-panel .page-view')).toBeTruthy()
    expect(layout.style.gridTemplateColumns).toBe('1fr 480px')
    unmount()
  })

  it('面板可全屏与还原，切换聚焦调用时退出全屏', async () => {
    const tools = [pageTool({ render: createArgsView('page-view'), renderTo: 'panel' })]
    const transport = createPageTransport([
      { id: 'c1', arguments: '{"page":"form"}' },
      { id: 'c2', arguments: '{"page":"list"}' }
    ])
    const { host, chat, unmount } = mountAiChat({ transport, tools })

    chat.value?.send('打开表单页和列表页')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-side-panel .page-view')).toBeTruthy()
    })
    const layout = host.querySelector<HTMLElement>('.u-ai-chat')!
    expect(layout.style.gridTemplateColumns).toBe('1fr 420px')

    const fullscreenBtn = host.querySelector<HTMLElement>('.u-ai-side-panel__fullscreen')!
    expect(fullscreenBtn.title).toBe('全屏')
    fullscreenBtn.click()
    await nextTick()
    expect(host.querySelector('.u-ai-side-panel.is-fullscreen')).toBeTruthy()
    expect(fullscreenBtn.title).toBe('还原')
    expect(host.querySelector('.u-ai-side-panel__close')).toBeTruthy()

    // 点还原 → 移除 is-fullscreen，列宽不被全屏态污染
    fullscreenBtn.click()
    await nextTick()
    expect(host.querySelector('.u-ai-side-panel.is-fullscreen')).toBeFalsy()
    expect(host.querySelector('.u-ai-side-panel')).toBeTruthy()
    expect(layout.style.gridTemplateColumns).toBe('1fr 420px')

    fullscreenBtn.click()
    await nextTick()
    expect(host.querySelector('.u-ai-side-panel.is-fullscreen')).toBeTruthy()

    await expandStepLine(host)
    const firstCard = host.querySelectorAll<HTMLElement>('.u-ai-tool-call')[0]!
    const entryBtn = [
      ...firstCard.querySelectorAll<HTMLElement>('.u-ai-tool-call__panel-entry button')
    ].find((btn) => btn.textContent?.includes('查看面板'))!
    entryBtn.click()
    await nextTick()
    expect(host.querySelector('.u-ai-side-panel.is-fullscreen')).toBeFalsy()
    expect(host.querySelector('.u-ai-side-panel .page-view')?.textContent).toContain('form')
    unmount()
  })

  it('点击面板刷新按钮会重新挂载渲染面板中的工具组件', async () => {
    let mountCount = 0
    let unmountCount = 0
    const StatefulPanelView = defineComponent({
      props: { toolCall: { type: Object as PropType<ChatToolCall>, required: true } },
      setup() {
        const instanceNo = ++mountCount
        const localCount = ref(0)
        onUnmounted(() => {
          unmountCount++
        })
        return () =>
          h('div', { class: 'refresh-view' }, [
            h('span', { class: 'refresh-instance' }, `instance:${instanceNo}`),
            h(
              'button',
              { type: 'button', class: 'refresh-inc', onClick: () => localCount.value++ },
              `count:${localCount.value}`
            )
          ])
      }
    })
    const tools = [pageTool({ render: StatefulPanelView, renderTo: 'panel' })]
    const { host, chat, unmount } = mountAiChat({ transport: createPageTransport(), tools })

    chat.value?.send('打开表单页')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-side-panel .refresh-view')).toBeTruthy()
    })

    expect(mountCount).toBe(1)
    expect(unmountCount).toBe(0)
    expect(host.querySelector('.refresh-instance')?.textContent).toBe('instance:1')

    host.querySelector<HTMLButtonElement>('.refresh-inc')!.click()
    await nextTick()
    expect(host.querySelector('.refresh-inc')?.textContent).toBe('count:1')

    const refreshBtn = host.querySelector<HTMLElement>('.u-ai-side-panel__refresh')!
    expect(refreshBtn.title).toBe('刷新')
    refreshBtn.click()
    await nextTick()

    expect(mountCount).toBe(2)
    expect(unmountCount).toBe(1)
    expect(host.querySelector('.refresh-instance')?.textContent).toBe('instance:2')
    expect(host.querySelector('.refresh-inc')?.textContent).toBe('count:0')
    unmount()
  })

  it('输入区使用原生 textarea，工具栏左侧提供 + 号选项面板与上传附件入口', async () => {
    const { host, unmount } = mountAiChat({ transport: () => {} })

    expect(host.querySelector('textarea.u-ai-composer__input')).toBeTruthy()
    const plusTrigger = host.querySelector<HTMLElement>(
      '.u-ai-composer__toolbar-left .u-ai-context-picker__trigger'
    )
    expect(plusTrigger).toBeTruthy()
    expect(host.querySelector('.u-ai-composer__toolbar-left .u-file-picker')).toBeFalsy()

    plusTrigger!.click()
    await vi.waitFor(() => {
      expect(document.body.querySelector('.u-ai-context-picker__panel')).toBeTruthy()
    })

    const panel = document.body.querySelector('.u-ai-context-picker__panel')!
    const pickerInput = panel.querySelector<HTMLInputElement>('.u-file-picker input[type="file"]')
    expect(pickerInput).toBeTruthy()
    expect(pickerInput!.getAttribute('accept')).toBeNull()
    expect(panel.textContent).toContain('上传附件')
    unmount()
  })

  it('支持上传图片与任意非图片附件：图片可预览，非图片本地提取文本且文件卡片以扩展名徽标标识', async () => {
    let sentAttachments: ChatMessage['attachments']
    const transport: ChatTransport = (req, handlers) => {
      const userMsg = req.messages.find((m) => m.role === 'user')
      sentAttachments = userMsg?.attachments
      handlers.onTextDelta('已收到')
    }

    const { host, unmount } = mountAiChat({ transport })

    const plusTrigger = host.querySelector<HTMLElement>('.u-ai-context-picker__trigger')!
    plusTrigger.click()
    await vi.waitFor(() => {
      expect(document.body.querySelector('.u-ai-context-picker__panel')).toBeTruthy()
    })

    const pickerInput = document.body.querySelector<HTMLInputElement>(
      '.u-ai-context-picker__panel .u-file-picker input[type="file"]'
    )!
    const imgFile = new File([new Uint8Array([137, 80, 78, 71])], 'photo.png', {
      type: 'image/png'
    })
    const mdFile = new File(['# Title\nBody'], 'notes.md', { type: 'text/markdown' })
    const zipFile = new File([new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00])], 'data.zip', {
      type: 'application/zip'
    })
    const dwgFile = new File([new Uint8Array([0x41, 0x43, 0x00, 0x31])], 'drawing.dwg', {
      type: 'application/acad'
    })
    const noExtFile = new File(['build:'], 'Makefile')

    Object.defineProperty(pickerInput, 'files', {
      value: [imgFile, mdFile, zipFile, dwgFile, noExtFile],
      configurable: true
    })
    pickerInput.dispatchEvent(new Event('change', { bubbles: true }))

    await vi.waitFor(() => {
      expect(
        host.querySelectorAll('.u-ai-composer__attachments .u-ai-attachments__item').length
      ).toBe(5)
    })

    const inputImgs = host.querySelectorAll(
      '.u-ai-composer__attachments .u-ai-attachments__item.is-image img'
    )
    const inputFiles = host.querySelectorAll(
      '.u-ai-composer__attachments .u-ai-attachments__item.is-file'
    )
    expect(inputImgs.length).toBe(1)
    expect(inputFiles.length).toBe(4)
    expect(inputFiles[0]?.textContent).toContain('notes.md')
    expect(inputFiles[1]?.textContent).toContain('data.zip')
    expect(inputFiles[2]?.textContent).toContain('drawing.dwg')
    expect(inputFiles[3]?.textContent).toContain('Makefile')

    // 扩展名徽标统一大写；未收录扩展名原样大写；无扩展名兜底 FILE
    const inputBadges = Array.from(
      host.querySelectorAll(
        '.u-ai-composer__attachments .u-ai-attachments__item .u-ai-attachments__ext'
      )
    ).map((el) => el.textContent)
    expect(inputBadges).toEqual(['MD', 'ZIP', 'DWG', 'FILE'])

    ;(inputImgs[0] as HTMLElement).click()
    await vi.waitFor(() => {
      expect(document.body.querySelector('.u-image-previewer img')).toBeTruthy()
    })
    expect(document.body.querySelector('.u-image-previewer img')?.getAttribute('src')).toMatch(
      /^data:image\/png/
    )

    document.body.querySelector<HTMLElement>('.u-image-previewer [aria-label="关闭"]')!.click()
    await vi.waitFor(() => {
      expect(document.body.querySelector('.u-image-previewer')).toBeNull()
    })

    const textarea = host.querySelector<HTMLTextAreaElement>('textarea.u-ai-composer__input')!
    textarea.value = '请查看附件'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    )

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-bubble--user')).toBeTruthy()
    })

    expect(sentAttachments?.length).toBe(5)
    expect(sentAttachments?.[0]?.dataUrl).toMatch(/^data:image\/png/)
    expect(sentAttachments?.[1]?.name).toBe('notes.md')
    expect(sentAttachments?.[1]?.dataUrl).toBe('')
    expect(sentAttachments?.[1]?.textContent).toBe('# Title\nBody')
    expect(sentAttachments?.[2]?.name).toBe('data.zip')
    expect(sentAttachments?.[2]?.dataUrl).toBe('')
    expect(sentAttachments?.[2]?.textContent).toBeUndefined()
    expect(sentAttachments?.[3]?.name).toBe('drawing.dwg')
    expect(sentAttachments?.[3]?.textContent).toBeUndefined()
    expect(sentAttachments?.[4]?.name).toBe('Makefile')
    expect(sentAttachments?.[4]?.textContent).toBe('build:')

    const msgImg = host.querySelector<HTMLElement>(
      '.u-ai-bubble--user .u-ai-bubble__attachments .u-ai-attachments__image'
    )
    const msgFiles = host.querySelectorAll(
      '.u-ai-bubble--user .u-ai-bubble__attachments .u-ai-attachments__item.is-file'
    )
    expect(msgImg).toBeTruthy()
    expect(msgFiles.length).toBe(4)
    expect(msgFiles[0]?.textContent).toContain('notes.md')
    expect(msgFiles[1]?.textContent).toContain('data.zip')
    expect(msgFiles[2]?.textContent).toContain('drawing.dwg')
    expect(msgFiles[3]?.textContent).toContain('Makefile')

    const msgBadges = Array.from(
      host.querySelectorAll('.u-ai-bubble--user .u-ai-attachments__ext')
    ).map((el) => el.textContent)
    expect(msgBadges).toEqual(inputBadges)

    msgImg!.click()
    await vi.waitFor(() => {
      expect(document.body.querySelector('.u-image-previewer img')).toBeTruthy()
    })
    document.body.querySelector<HTMLElement>('.u-image-previewer [aria-label="关闭"]')!.click()
    await vi.waitFor(() => {
      expect(document.body.querySelector('.u-image-previewer')).toBeNull()
    })
    unmount()
  })

  it('支持在输入框直接通过剪贴板粘贴图片加入附件列表', async () => {
    const { host, unmount } = mountAiChat({ transport: () => {} })
    const textarea = host.querySelector<HTMLTextAreaElement>('textarea.u-ai-composer__input')!

    const pastedImage = new File([new Uint8Array([137, 80, 78, 71])], 'clip.png', {
      type: 'image/png'
    })
    const pasteImageEvent = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(pasteImageEvent, 'clipboardData', {
      value: {
        items: [{ kind: 'file', type: 'image/png', getAsFile: () => pastedImage }],
        files: [],
        getData: () => ''
      }
    })
    textarea.dispatchEvent(pasteImageEvent)

    expect(pasteImageEvent.defaultPrevented).toBe(true)
    await vi.waitFor(() => {
      expect(
        host.querySelectorAll('.u-ai-composer__attachments .u-ai-attachments__item.is-image img')
          .length
      ).toBe(1)
    })

    const pasteTextEvent = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(pasteTextEvent, 'clipboardData', {
      value: {
        items: [{ kind: 'string', type: 'text/plain', getAsFile: () => null }],
        files: [],
        getData: () => 'hello'
      }
    })
    textarea.dispatchEvent(pasteTextEvent)
    expect(pasteTextEvent.defaultPrevented).toBe(false)
    expect(
      host.querySelectorAll('.u-ai-composer__attachments .u-ai-attachments__item').length
    ).toBe(1)
    unmount()
  })

  it('输入法组合态回车不发送：isComposing / keyCode 229 的 Enter 被忽略', async () => {
    const { host, unmount } = mountAiChat({ transport: () => {} })
    const textarea = host.querySelector<HTMLTextAreaElement>('textarea.u-ai-composer__input')!

    // 已输入 "AB" 后进入 IME 组合态（v-model 不含组合文本），回车仅为上屏拼音
    textarea.value = 'AB'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    textarea.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    textarea.value = 'ABnihao'

    // Chromium 顺序：compositionend 之前发 isComposing=true 的 keydown
    const composing = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true
    })
    Object.defineProperty(composing, 'isComposing', { value: true })
    Object.defineProperty(composing, 'keyCode', { value: 229 })
    textarea.dispatchEvent(composing)
    await nextTick()

    expect(host.querySelector('.u-ai-bubble--user')).toBeFalsy()
    expect(textarea.value).toBe('ABnihao')
    expect(composing.defaultPrevented).toBe(false)

    // Safari 顺序：compositionend 之后补发 keyCode=229 的幻影 keydown
    textarea.dispatchEvent(new CompositionEvent('compositionend', { data: 'nihao', bubbles: true }))
    const phantom = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    Object.defineProperty(phantom, 'keyCode', { value: 229 })
    textarea.dispatchEvent(phantom)
    await nextTick()

    expect(host.querySelector('.u-ai-bubble--user')).toBeFalsy()
    expect(textarea.value).toBe('ABnihao')
    unmount()
  })

  it('组合上屏后的正常回车才发送上屏内容', async () => {
    const { host, unmount } = mountAiChat({
      transport: (_req, handlers) => handlers.onTextDelta('收到')
    })
    const textarea = host.querySelector<HTMLTextAreaElement>('textarea.u-ai-composer__input')!

    textarea.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    textarea.value = '你好'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    textarea.dispatchEvent(new CompositionEvent('compositionend', { data: '你好', bubbles: true }))

    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    )
    await nextTick()

    const bubble = host.querySelector('.u-ai-bubble--user .u-ai-bubble__text')
    expect(bubble?.textContent).toBe('你好')
    expect(textarea.value).toBe('')
    unmount()
  })

  it('空白输入（空格/换行）回车与发送按钮均不可发送', async () => {
    const { host, unmount } = mountAiChat({ transport: () => {} })
    const textarea = host.querySelector<HTMLTextAreaElement>('textarea.u-ai-composer__input')!

    textarea.value = '  \n\t '
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    const sendBtn = host.querySelector<HTMLElement>('.u-ai-composer__toolbar-right > .u-button')!
    expect(sendBtn.classList.contains('is-disabled')).toBe(true)

    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    )
    await nextTick()

    expect(host.querySelector('.u-ai-bubble--user')).toBeFalsy()
    // 内容不因回车被清空
    expect(textarea.value).toBe('  \n\t ')
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

    const actionButtons = () => host.querySelectorAll('.u-ai-composer__toolbar-right > .u-button')

    expect(host.querySelector('.u-ai-composer__stop')).toBeTruthy()
    expect(actionButtons()).toHaveLength(1)

    const textarea = host.querySelector<HTMLTextAreaElement>('textarea.u-ai-composer__input')!
    textarea.value = '下一条'
    textarea.dispatchEvent(new Event('input'))
    await nextTick()

    expect(host.querySelector('.u-ai-composer__stop')).toBeFalsy()
    expect(actionButtons()).toHaveLength(1)
    const sendBtn = actionButtons()[0]!
    expect(sendBtn.classList.contains('is-disabled')).toBe(false)
    expect(sendBtn.getAttribute('title')).toBe('加入待发送队列')

    sendBtn.click()
    await nextTick()

    expect(
      [...host.querySelectorAll('.u-ai-message-queue__text')].map((el) => el.textContent)
    ).toEqual(['下一条'])
    expect(textarea.value).toBe('')
    expect(host.querySelector('.u-ai-composer__stop')).toBeTruthy()

    chat.value?.abort()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-composer__stop')).toBeFalsy()
    })
    unmount()
  })

  it('有 models 时渲染模型选择器；当前模型无 reasoningLevels 时不展示推理选择器', async () => {
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
    expect(
      host.querySelector('.u-ai-composer__toolbar-right .u-ai-model-picker__trigger')
    ).toBeTruthy()
    expect(
      host.querySelector('.u-ai-composer__toolbar-left .u-ai-model-picker__trigger')
    ).toBeFalsy()
    expect(host.querySelector('.u-ai-reasoning-picker__trigger')).toBeFalsy()
    unmount()
  })

  it('切换到带 reasoningLevels 的模型后展示独立推理选择器并可切换等级', async () => {
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

    expect(host.querySelector('.u-ai-reasoning-picker__trigger')).toBeFalsy()

    model.value = 'o3-mini'
    await nextTick()

    const trigger = host.querySelector<HTMLElement>(
      '.u-ai-composer__toolbar-right .u-ai-reasoning-picker__trigger'
    )
    expect(trigger).toBeTruthy()
    expect(trigger?.textContent).toContain('低')
    expect(reasoningLevel.value).toBe('low')

    // 打开面板切换等级；面板 teleport 到 body 下的 popper 容器
    trigger!.click()
    await vi.waitFor(() => {
      expect(document.querySelector('.u-ai-reasoning-picker__option')).toBeTruthy()
    })
    const highOption = [
      ...document.querySelectorAll<HTMLElement>('.u-ai-reasoning-picker__option')
    ].find((el) => el.textContent?.includes('高'))
    highOption!.click()
    await nextTick()
    expect(reasoningLevel.value).toBe('high')
    expect(trigger?.textContent).toContain('高')

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

    const items = [...host.querySelectorAll('.u-ai-message-queue__text')].map(
      (el) => el.textContent
    )
    expect(items).toEqual(['第二条', '第三条'])
    expect(host.querySelector('.u-ai-message-queue__head')?.textContent).toContain('2')
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
      expect(host.querySelector('.u-ai-message-queue__item')).toBeTruthy()
    })

    const startBtn = [...host.querySelectorAll<HTMLElement>('.u-ai-message-queue__action')].find(
      (btn) => btn.textContent?.includes('立即开始')
    )!
    startBtn.click()

    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('回答:第二条')
    })
    expect(host.textContent).toContain('已停止生成')
    expect(host.querySelector('.u-ai-message-queue')).toBeFalsy()
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

    const itemA = [...host.querySelectorAll<HTMLElement>('.u-ai-message-queue__item')].find((el) =>
      el.textContent?.includes('A')
    )!
    itemA.querySelector<HTMLElement>('[title="取回输入框编辑"]')!.click()
    await nextTick()

    const textarea = host.querySelector<HTMLTextAreaElement>('textarea.u-ai-composer__input')!
    expect(textarea.value).toBe('A')
    expect(
      [...host.querySelectorAll('.u-ai-message-queue__text')].map((el) => el.textContent)
    ).toEqual(['B'])

    textarea.value = 'A2'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()

    expect(
      [...host.querySelectorAll('.u-ai-message-queue__text')].map((el) => el.textContent)
    ).toEqual(['A2', 'B'])
    unmount()
  })

  it('welcome 逐条展示：点击文案发送，点击球立即换下一条', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('收到')
    }
    const { host, unmount } = mountAiChat({ transport, welcome: ['第一条建议', '第二条建议'] })
    await nextTick()

    const items = host.querySelectorAll<HTMLElement>('.u-ai-message-list__welcome-item')
    expect(items.length).toBe(1)
    expect(items[0]!.textContent).toBe('第一条建议')

    host.querySelector<HTMLElement>('.u-ai-message-list__welcome canvas.u-ai-orb')!.click()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-message-list__welcome-item')?.textContent).toBe('第二条建议')
    })

    // 点击文案 → 以当前展示的文案发送；吉祥物栏原位切换为工作态（不进入消息列表）
    host.querySelector<HTMLElement>('.u-ai-message-list__welcome-item')!.click()
    await nextTick()

    expect(
      host.querySelector('.u-ai-message-list__welcome')?.classList.contains('is-working')
    ).toBe(true)
    expect(
      host.querySelector('.u-ai-message-list__welcome .u-ai-message-list__working')
    ).toBeTruthy()
    expect(host.querySelector('.u-ai-message-list__scroll .u-ai-message-list__working')).toBeFalsy()
    const userBubble = host.querySelector('.u-ai-bubble--user .u-ai-bubble__bubble')
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
      expect(host.querySelector('.u-ai-message-list__welcome-item')?.textContent).toBe('第一条建议')

      await vi.advanceTimersByTimeAsync(4100)
      expect(host.querySelector('.u-ai-message-list__welcome-item')?.textContent).toBe('第二条建议')

      await vi.advanceTimersByTimeAsync(4100)
      expect(host.querySelector('.u-ai-message-list__welcome-item')?.textContent).toBe('第一条建议')
      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('生成中原位展示「工作中…」指示，中断后停留再恢复欢迎区', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'] })
    try {
      const transport: ChatTransport = (req) => {
        return new Promise<void>((resolve) => {
          req.signal.addEventListener('abort', () => resolve(), { once: true })
        })
      }
      const { host, chat, unmount } = mountAiChat({ transport })

      expect(host.querySelector('.u-ai-message-list__working')).toBeFalsy()
      expect(host.querySelector('.u-ai-message-list__welcome')).toBeTruthy()
      expect(
        host.querySelector('.u-ai-message-list__scroll .u-ai-message-list__welcome')
      ).toBeFalsy()

      chat.value?.send('hi')
      await nextTick()

      expect(
        host.querySelector('.u-ai-message-list__scroll .u-ai-message-list__working')
      ).toBeFalsy()
      const working = host.querySelector('.u-ai-message-list__welcome .u-ai-message-list__working')
      expect(working).toBeTruthy()
      expect(working?.textContent).toContain('工作中')
      const orb = host.querySelector(
        '.u-ai-message-list__welcome canvas.u-ai-orb'
      ) as HTMLElement | null
      expect(orb).toBeTruthy()
      expect(orb?.style.width).toBe('48px')

      chat.value?.abort()
      await nextTick()
      await Promise.resolve()
      await nextTick()

      const lingering = host.querySelector('.u-ai-message-list__working')
      expect(lingering).toBeTruthy()
      expect(lingering?.textContent).not.toContain('工作中')

      await vi.advanceTimersByTimeAsync(2499)
      expect(host.querySelector('.u-ai-message-list__working')).toBeTruthy()
      await vi.advanceTimersByTimeAsync(2)
      await nextTick()
      expect(host.querySelector('.u-ai-message-list__working')).toBeFalsy()
      expect(host.querySelector('.u-ai-message-list__welcome')).toBeTruthy()
      expect(
        host.querySelector('.u-ai-message-list__scroll .u-ai-message-list__welcome')
      ).toBeFalsy()
      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('回答完毕后工作态原位停留约 2.5s 再恢复欢迎区', async () => {
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

      const working = host.querySelector('.u-ai-message-list__working')
      expect(working).toBeTruthy()
      expect(working?.textContent).not.toContain('工作中')
      expect(host.querySelector('.u-ai-message-list__welcome canvas.u-ai-orb')).toBeTruthy()

      await vi.advanceTimersByTimeAsync(2499)
      expect(host.querySelector('.u-ai-message-list__working')).toBeTruthy()
      await vi.advanceTimersByTimeAsync(2)
      await nextTick()
      expect(host.querySelector('.u-ai-message-list__working')).toBeFalsy()
      expect(host.querySelector('.u-ai-message-list__welcome')).toBeTruthy()
      unmount()
    } finally {
      vi.useRealTimers()
    }
  })

  it('对话出错后工作态原位停留约 2.5s 再恢复欢迎区', async () => {
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

      const working = host.querySelector('.u-ai-message-list__working')
      expect(working).toBeTruthy()
      expect(working?.textContent).not.toContain('工作中')

      await vi.advanceTimersByTimeAsync(2500)
      await nextTick()
      expect(host.querySelector('.u-ai-message-list__working')).toBeFalsy()
      expect(host.querySelector('.u-ai-message-list__welcome')).toBeTruthy()
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

    expect(host.querySelector('.u-ai-chat__clear')).toBeTruthy()
    expect(host.querySelector('.u-ai-chat__clear-wrap')?.classList.contains('is-disabled')).toBe(
      true
    )
    expect(host.querySelector('.u-ai-context-usage__trigger')).toBeFalsy()

    chat.value?.send('你好')
    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('回复')
    })
    expect(host.querySelector('.u-ai-chat__clear-wrap')?.classList.contains('is-disabled')).toBe(
      false
    )

    chat.value?.clear()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-message-list__welcome')?.textContent).toContain(
        '有什么可以帮你？'
      )
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
    expect(host.querySelector('.u-ai-message-list__working')).toBeTruthy()

    chat.value?.clear()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-message-list__working')).toBeFalsy()
      expect(host.querySelector('.u-ai-message-list__welcome')?.textContent).toContain('欢迎回来')
    })
    unmount()
  })

  async function openUsagePanel(host: HTMLElement) {
    const trigger = host.querySelector<HTMLElement>('.u-ai-context-usage__trigger')
    trigger?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    await nextTick()
    await nextTick()
    const panel = document.body.querySelector('.u-ai-context-usage__panel')
    const rows: Record<string, string> = {}
    panel?.querySelectorAll('.u-ai-context-usage__row').forEach((row) => {
      const label = row.querySelector('.u-ai-context-usage__label')?.textContent ?? ''
      rows[label] = row.querySelector('.u-ai-context-usage__value')?.textContent ?? ''
    })
    return rows
  }

  it('有 usage 时显示用量环，悬停弹出明细；tokenUsageDetail 追加缓存命中/未命中', async () => {
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
    expect(compact.host.querySelector('.u-ai-context-usage__trigger')).toBeFalsy()
    compact.chat.value?.send('hi')
    await vi.waitFor(() => {
      expect(compact.host.querySelector('.u-ai-context-usage__trigger')).toBeTruthy()
    })
    const compactRows = await openUsagePanel(compact.host)
    expect(compactRows['总 token']).toBe('12')
    expect(compactRows['输入']).toBe('10')
    expect(compactRows['输出']).toBe('2')
    expect(compactRows['缓存命中']).toBeUndefined()
    compact.unmount()

    const detail = mountAiChat({ transport: usageTransport, tokenUsageDetail: true })
    detail.chat.value?.send('hi')
    await vi.waitFor(() => {
      expect(detail.host.querySelector('.u-ai-context-usage__trigger')).toBeTruthy()
    })
    const detailRows = await openUsagePanel(detail.host)
    expect(detailRows['总 token']).toBe('12')
    expect(detailRows['缓存命中']).toBe('4')
    expect(detailRows['缓存未命中']).toBe('6')
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
      expect(scaled.host.querySelector('.u-ai-context-usage__trigger')).toBeTruthy()
    })
    const scaledRows = await openUsagePanel(scaled.host)
    expect(scaledRows['总 token']).toBe('1.5K')
    expect(scaledRows['缓存命中']).toBe('1K')
    expect(scaledRows['缓存未命中']).toBe('1M')
    scaled.unmount()

    const noCacheTransport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('ok')
      handlers.onUsage?.({ promptTokens: 10, completionTokens: 2, totalTokens: 12 })
    }
    const noCache = mountAiChat({ transport: noCacheTransport, tokenUsageDetail: true })
    noCache.chat.value?.send('hi')
    await vi.waitFor(() => {
      expect(noCache.host.querySelector('.u-ai-context-usage__trigger')).toBeTruthy()
    })
    const noCacheRows = await openUsagePanel(noCache.host)
    expect(noCacheRows['总 token']).toBe('12')
    expect(Object.keys(noCacheRows).some((label) => label.includes('缓存'))).toBe(false)
    noCache.unmount()
  })

  it('模型声明 contextWindow 时用量环按上下文占用填充，面板展示占比', async () => {
    const usageTransport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('ok')
      handlers.onUsage?.({ promptTokens: 600, completionTokens: 400, totalTokens: 1000 })
    }
    const models: ChatModelOption[] = [
      { id: 'm1', label: 'M1', providerId: 'p1', contextWindow: 10000 }
    ]
    const { host, chat, unmount } = mountAiChat({ transport: usageTransport, models, model: 'm1' })
    chat.value?.send('hi')
    await vi.waitFor(() => {
      const ring = host.querySelector('.u-ai-context-usage__ring-value')
      expect(ring?.getAttribute('stroke-dasharray')).toBe('10 100')
    })
    const rows = await openUsagePanel(host)
    expect(rows['上下文占用']).toBe('1K / 10K · 10%')
    unmount()
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
    const header = host.querySelector<HTMLElement>('.u-ai-tool-call .u-collapse__header')
    header?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    await nextTick()
  }

  function assertGenericCard(host: HTMLElement, status: 'pending' | 'success' | 'error') {
    const card = host.querySelector(`.u-ai-tool-call.is-${status}`)
    expect(card).toBeTruthy()
    expect(host.querySelector('.u-ai-tool-call__name')?.textContent).toBe(UNKNOWN_TOOL)
    expect(host.querySelector('.u-ai-tool-call__status')).toBeTruthy()
    expect(host.textContent).not.toContain('未找到')
  }

  it('未注册工具名 pending → success 走出通用卡片，无空白、无未找到工具文案', async () => {
    const { call, messages } = seedUnknownCall()
    const { host, unmount } = mountAiChat({ transport: () => {}, messages })
    await nextTick()

    // 历史回放（非运行中）步骤行收起：展开后卡片可见
    await expandStepLine(host)

    assertGenericCard(host, 'pending')
    expect(host.querySelector('.u-ai-tool-call__name')?.classList.contains('u-shine')).toBe(true)
    expect(host.querySelector('.u-ai-tool-call.is-active')).toBeFalsy()

    // 手动展开（单标量参数已在头部覆盖，不重复渲染）
    await expandToolCard(host)
    expect(host.textContent).toContain('hi')
    expect(host.querySelector('.u-ai-tool-call__data')).toBeFalsy()

    call.status = 'success'
    call.result = '{"ok":true}'
    await nextTick()
    assertGenericCard(host, 'success')

    // 用户已手动展开过，进入终态后保持展开并展示结果原始块
    expect(host.querySelector('.u-ai-tool-call__data')?.textContent).toBe('{"ok":true}')
    unmount()
  })

  it('未注册工具名 pending → error 走出通用卡片，无空白、无未找到工具文案', async () => {
    const { call, messages } = seedUnknownCall()
    const { host, unmount } = mountAiChat({ transport: () => {}, messages })
    await nextTick()
    await expandStepLine(host)
    assertGenericCard(host, 'pending')

    call.status = 'error'
    call.error = 'boom'
    await nextTick()
    assertGenericCard(host, 'error')

    await expandToolCard(host)
    const errorBlock = host.querySelector('.u-ai-tool-call__data.is-error')
    expect(errorBlock?.textContent).toBe('boom')
    expect(host.textContent).not.toContain('错误')
    unmount()
  })

  it('通用卡片直接渲染 result 与 view 等宽文本块，无区块标题文本', async () => {
    const long = 'x'.repeat(500)
    const { messages } = seedUnknownCall({
      status: 'success',
      result: JSON.stringify({ data: long }),
      view: { kind: 'diff', body: 'patch-xyz' }
    })
    const { host, unmount } = mountAiChat({ transport: () => {}, messages })
    await nextTick()
    await expandStepLine(host)
    await expandToolCard(host)

    const blocks = [...host.querySelectorAll<HTMLElement>('.u-ai-tool-call__data')]
    expect(blocks.length).toBe(2)
    expect(blocks[0]?.textContent).toContain(long)
    expect(blocks[1]?.textContent).toContain('patch-xyz')
    expect(host.textContent).not.toContain('结果')
    expect(host.textContent).not.toContain('视图')
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
    await expandStepLine(host)
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
      expect(host.querySelector('.u-ai-step-group__title')?.textContent).toBe('askQuestion')
    })
    await expandStepLine(host)
    expect(host.querySelector('.u-ai-tool-call__name')?.textContent).toBe('askQuestion')
    expect(host.querySelector('.u-ai-question-card')).toBeFalsy()
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
      expect(host.querySelector('.u-ai-tool-call__name')?.textContent).toBe('服务端工具')
    })
    expect(host.querySelector('.meta-render')?.textContent).toBe('meta-body')
    expect(host.textContent).not.toContain('参数')
    unmount()
  })
})

function createFakeAdapter(options?: {
  history?: ChatSessionEvent[]
}): ChatSessionAdapter & { emit: (event: ChatSessionEvent) => void } {
  let listener: { onEvent(event: ChatSessionEvent): void } | undefined
  const adapter: ChatSessionAdapter = {
    subscribe(handlers) {
      listener = handlers
      return () => {
        listener = undefined
      }
    },
    send: vi.fn(async () => {}),
    cancel: vi.fn(async () => {}),
    respond: vi.fn(async () => {}),
    fetchHistory: vi.fn(async () => ({ events: options?.history ?? [], hasMore: false })),
    selectModel: vi.fn(async () => {})
  }
  return Object.assign(adapter, {
    emit(event: ChatSessionEvent) {
      listener?.onEvent(event)
    }
  })
}

async function mountSession(options?: {
  history?: ChatSessionEvent[]
  readonly?: boolean
  welcome?: string | string[]
}) {
  const adapter = createFakeAdapter({ history: options?.history })
  const mounted = mountAiChat({
    transport: createServerTransport(adapter),
    readonly: options?.readonly,
    welcome: options?.welcome
  })
  await vi.waitFor(() => {
    expect(adapter.fetchHistory).toHaveBeenCalled()
  })
  return { ...mounted, adapter }
}

const click = (el: HTMLElement) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))

describe('UAiChat P4 作业条 / 审批 / 只读 / 提问', () => {
  it('无 jobs 不渲染作业条；有 jobs 显示图标、文案、状态点，进行中扫光', async () => {
    const { host, adapter, unmount } = await mountSession()
    expect(host.querySelector('.u-ai-job-bar')).toBeFalsy()

    adapter.emit({
      type: 'jobs/snapshot',
      jobs: [{ id: 'j1', kind: 'bash', label: '跑测试', status: 'running' }]
    })
    await nextTick()

    expect(host.querySelector('.u-ai-job-bar')).toBeTruthy()
    expect(host.querySelector('.u-ai-job-bar__label')?.textContent).toContain('跑测试')
    expect(host.querySelector('.u-ai-job-bar__label')?.classList.contains('u-shine')).toBe(true)
    expect(host.querySelector('.u-ai-job-bar__dot.is-running')).toBeTruthy()

    host.querySelector<HTMLElement>('.u-ai-job-bar__head')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-job-bar__item')).toBeFalsy()
    unmount()
  })

  it('审批横幅仅无 callId 出现；有 callId 走工具卡确认', async () => {
    const { host, adapter, unmount } = await mountSession()

    adapter.emit({ type: 'tool/call', callId: 'c1', name: 'bash', arguments: '{}', seq: 1 })
    adapter.emit({
      type: 'approval/requested',
      approvalId: 'a1',
      toolName: 'bash',
      callId: 'c1',
      rpcId: 'rpc-card'
    })
    await nextTick()

    expect(host.querySelector('.u-ai-approval-banner__card')).toBeFalsy()
    expect(host.querySelector('.u-ai-tool-call__confirm')).toBeTruthy()

    adapter.emit({
      type: 'approval/requested',
      approvalId: 'a2',
      toolName: 'deploy',
      reason: '发布到生产',
      rpcId: 'rpc-banner'
    })
    await nextTick()

    expect(host.querySelector('.u-ai-approval-banner__card')).toBeTruthy()
    expect(host.textContent).toContain('发布到生产')

    const allow = [
      ...host.querySelectorAll<HTMLElement>('.u-ai-approval-banner__card button')
    ].find((btn) => btn.textContent?.includes('允许'))!
    click(allow)
    await vi.waitFor(() => {
      expect(adapter.respond).toHaveBeenCalledWith('rpc-banner', true, undefined)
    })
    unmount()
  })

  it('readonly 不展示输入区，欢迎语点击不发送，队列无插队编辑移除', async () => {
    const { host, adapter, unmount } = await mountSession({ readonly: true, welcome: '点我发送' })
    expect(host.querySelector('.u-ai-composer')).toBeFalsy()

    host.querySelector<HTMLElement>('.u-ai-message-list__welcome-item')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-bubble--user')).toBeFalsy()

    adapter.emit({ type: 'queue/snapshot', items: [{ id: 'q1', content: '排队中' }] })
    await nextTick()
    expect(host.querySelector('.u-ai-message-queue__text')?.textContent).toContain('排队中')
    expect(host.querySelector('.u-ai-message-queue__actions')).toBeFalsy()
    unmount()
  })

  it('非只读客户端输入区与欢迎点击发送与现状一致', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('收到')
    }
    const { host, unmount } = mountAiChat({ transport, welcome: '快捷提问' })
    expect(host.querySelector('.u-ai-composer')).toBeTruthy()
    host.querySelector<HTMLElement>('.u-ai-message-list__welcome-item')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-bubble--user .u-ai-bubble__bubble')?.textContent).toContain(
      '快捷提问'
    )
    unmount()
  })

  it('ask-question 客户端提交走 resolveAskQuestion', async () => {
    const rounds: ChatMessage[][] = []
    let round = 0
    const transport: ChatTransport = (req, handlers) => {
      round++
      rounds.push(req.messages)
      if (round === 1) {
        handlers.onToolCall?.({
          id: 'q1',
          name: 'askQuestion',
          arguments: JSON.stringify({ questions: [{ question: 'Q？', options: ['A'] }] })
        })
      } else {
        handlers.onTextDelta('明白了')
      }
    }
    const { host, chat, unmount } = mountAiChat({ transport })
    chat.value?.send('提问')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('Q？')
    })
    click(
      [...host.querySelectorAll<HTMLElement>('.u-ai-question-card__opt')].find((el) =>
        el.textContent?.includes('A')
      )!
    )
    await nextTick()
    click(
      [...host.querySelectorAll<HTMLElement>('.u-ai-question-card__actions button')].find((btn) =>
        btn.textContent?.includes('提交')
      )!
    )
    await vi.waitFor(() => {
      expect(rounds.length).toBe(2)
    })
    const toolMessage = rounds[1]![rounds[1]!.length - 1]!
    expect(toolMessage.role).toBe('tool')
    expect(JSON.parse(toolMessage.content)).toEqual({ answers: [{ question: 'Q？', answer: 'A' }] })
    unmount()
  })

  it('ask-question session 提交走 session.respond', async () => {
    const { host, adapter, unmount } = await mountSession()
    adapter.emit({
      type: 'question/requested',
      rpcId: 'rpc-q',
      questions: [{ question: '选一个', options: ['A', 'B'] }]
    })
    await nextTick()
    expect(host.querySelector('.u-ai-question-card__q')?.textContent).toContain('选一个')

    click(
      [...host.querySelectorAll<HTMLElement>('.u-ai-question-card__opt')].find((el) =>
        el.textContent?.includes('A')
      )!
    )
    await nextTick()
    click(
      [...host.querySelectorAll<HTMLElement>('.u-ai-question-card__actions button')].find((btn) =>
        btn.textContent?.includes('提交')
      )!
    )
    await vi.waitFor(() => {
      expect(adapter.respond).toHaveBeenCalledWith('rpc-q', true, [
        { question: '选一个', answer: 'A' }
      ])
    })
    unmount()
  })
})
