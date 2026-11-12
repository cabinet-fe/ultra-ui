// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vite-plus/test'
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

/** 轮次落定后过程步骤收进步骤行：等待行出现并点击展开全部已执行步骤 */
async function expandStepLine(host: HTMLElement) {
  await vi.waitFor(() => {
    expect(host.querySelector('.u-ai-chat__step-line-bar')).toBeTruthy()
  })
  host.querySelector<HTMLElement>('.u-ai-chat__step-line-bar')!.click()
  await nextTick()
}

/** 等待步骤行定格为完成态摘要（轮次落定） */
async function waitForStepLineSettled(host: HTMLElement, count: number) {
  await vi.waitFor(() => {
    expect(host.querySelector('.u-ai-chat__step-line-title')?.textContent).toBe(
      `执行了 ${count} 个步骤`
    )
  })
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

    // 轮次落定后：步骤行定格为完成态摘要，过程 DOM 收进行内
    await waitForStepLineSettled(host, 1)
    expect(host.querySelector('.u-ai-chat__tool-call')).toBeFalsy()

    // 点击步骤行展开全部步骤
    await expandStepLine(host)

    expect(host.querySelector('.u-ai-chat__tool-call-name')?.textContent).toBe('calculate')
    expect(host.querySelector('.u-ai-chat__tool-call.is-success')).toBeTruthy()

    // 执行完成后自动折叠，点击头部展开
    const header = host.querySelector<HTMLElement>('.u-ai-chat__tool-call .u-collapse__header')!
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    await nextTick()

    const body = host.querySelector('.u-ai-chat__tool-call .u-collapse__content-wrapper')
    // 单标量参数已被头部摘要覆盖，body 不再重复罗列；结果单值直出答案本身
    expect(header.textContent).toContain('1+1')
    expect(body?.textContent).toContain('结果')
    expect(body?.textContent).toContain('2')
    expect(body?.textContent).not.toContain('Expression')
    expect(body?.textContent).not.toContain('Value')
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

    // 待确认：步骤列表自动展开，卡片头上的确认按钮可达
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__step-line-content')).toBeTruthy()
      expect(host.querySelector('.u-ai-chat__tool-call-confirm')).toBeTruthy()
    })
    // 单标量参数已在头部摘要完整可见，空 body 不再自动展开
    expect(host.querySelector('.u-ai-chat__tool-call-summary')?.textContent).toContain('/tmp/a')
    expect(host.querySelector('.u-ai-chat__tool-call.is-active')).toBeFalsy()
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

    // 待确认：步骤列表自动展开，确认按钮可达
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__step-line-content')).toBeTruthy()
      expect(host.querySelector('.u-ai-chat__tool-call-confirm')).toBeTruthy()
    })

    // 用户手动收起后不再自动展开
    host.querySelector<HTMLElement>('.u-ai-chat__step-line-bar')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__step-line-content')).toBeFalsy()
    expect(host.querySelector('.u-ai-chat__tool-call-confirm')).toBeFalsy()
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

    // 串行执行：行内先展示第一个工具，右侧显示步骤计数
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__step-line-title')?.textContent).toBe('search')
    })
    expect(host.querySelector('.u-ai-chat__step-line-count')?.textContent).toBe('2 步')

    // 第一个工具落定后：行内切换展示第二个工具（第二个仍挂起，行内保持其实时视图）
    releaseSearch?.()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__step-line-title')?.textContent).toBe('bash')
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

    // 最终答案输出后工具卡片收进步骤行，展开后断言
    await expandStepLine(host)

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

  it('render 自定义渲染替换卡片 body，完成后默认折叠、展开后可见', async () => {
    const tools = [weatherTool({ render: createResultView('weather-view') })]
    const { host, chat, unmount } = mountAiChat({ transport: createWeatherTransport(), tools })

    chat.value?.send('北京天气')

    // 最终答案输出后工具卡片收进步骤行，展开后断言
    await waitForStepLineSettled(host, 1)
    await expandStepLine(host)

    // render 工具完成后默认折叠（不再是保持展开）
    expect(host.querySelector('.u-ai-chat__tool-call.is-success')).toBeTruthy()
    expect(host.querySelector('.u-ai-chat__tool-call.is-active')).toBeFalsy()

    // 手动展开：render 替换默认参数/结果区
    const header = host.querySelector<HTMLElement>('.u-ai-chat__tool-call .u-collapse__header')!
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    await nextTick()
    expect(host.querySelector('.weather-view')?.textContent).toContain('{"temperature":26}')
    expect(host.querySelector('.u-ai-chat__tool-call-code')).toBeFalsy()
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
      expect(host.querySelector('.u-ai-chat__tool-call.is-success.is-active')).toBeTruthy()
    })
    expect(host.querySelector('.weather-view')?.textContent).toContain('{"temperature":26}')
    // 无正文答案的终结轮：操作区（重新生成）落在尾部状态载体上，不随步骤压缩丢失
    expect(host.querySelector('.u-ai-chat__message-actions [title="重新生成"]')).toBeTruthy()
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
      expect(host.querySelector('.u-ai-chat__reply-tool .weather-view')?.textContent).toContain(
        'result:{"temperature":26}'
      )
    })

    // 步骤行仍保留过程条目：展开后是默认参数/结果视图，不重复渲染自定义卡片
    await expandStepLine(host)
    expect(host.querySelector('.u-ai-chat__step-line-content .u-ai-chat__tool-call')).toBeTruthy()
    expect(host.querySelector('.u-ai-chat__step-line-content .weather-view')).toBeFalsy()

    // 无正文答案的终结轮：操作区（重新生成）仍落在尾部状态载体上
    expect(host.querySelector('.u-ai-chat__message-actions [title="重新生成"]')).toBeTruthy()
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

    // live 期卡片即在回复流渲染（无结果），步骤行走马灯同步展示当前工具步
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__reply-tool .weather-view')).toBeTruthy()
    })
    expect(host.querySelector('.u-ai-chat__step-line-title')?.textContent).toContain('getWeather')
    unmount()
  })

  it('renderTo: reply 未提供 render 时兜底标准工具卡片', async () => {
    const tools = [weatherTool({ renderTo: 'reply' })]
    const { host, chat, unmount } = mountAiChat({ transport: createWeatherTransport(), tools })

    chat.value?.send('北京天气')

    await waitForStepLineSettled(host, 1)
    // 无自定义渲染：回复流兜底渲染标准工具卡片（完成态）
    await vi.waitFor(() => {
      expect(
        host.querySelector('.u-ai-chat__reply-tool .u-ai-chat__tool-call.is-success')
      ).toBeTruthy()
    })
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
      expect(host.querySelector('.u-ai-chat__tool-call.is-success.is-active')).toBeTruthy()
    })
    expect(
      host.querySelector('.u-ai-chat__tool-call .u-collapse__content-wrapper')?.textContent
    ).toContain('2')
    unmount()
  })

  it('render 工具设置 autoCollapse: true 后完成即折叠', async () => {
    const tools = [weatherTool({ render: createResultView('weather-view'), autoCollapse: true })]
    const { host, chat, unmount } = mountAiChat({ transport: createWeatherTransport(), tools })

    chat.value?.send('北京天气')

    await waitForStepLineSettled(host, 1)
    await expandStepLine(host)

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

    // 轮次落定后步骤行展开，工具卡片重挂载为完成态（自动折叠）
    await waitForStepLineSettled(host, 1)
    await expandStepLine(host)

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
      '2'
    )
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

    // 思考中：步骤行行内展示「思考中…」与最新一行思考，步骤列表默认收起
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__step-line-title')?.textContent).toBe('思考中…')
    })
    expect(host.querySelector('.u-ai-chat__step-line-text')?.textContent).toBe('第一行思考')
    expect(host.querySelector('.u-ai-chat__reasoning')).toBeFalsy()

    // 流式推进后滚动到最新一行（跳过空行）
    steps.shift()?.()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__step-line-text')?.textContent).toBe('第二行思考')
    })

    // 展开步骤行：思考块可见（自身默认折叠）
    host.querySelector<HTMLElement>('.u-ai-chat__step-line-bar')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__reasoning-title')?.textContent).toContain('思考中')
    expect(host.querySelector('.u-ai-chat__reasoning-content')).toBeFalsy()

    // 正文开始输出：该段闭合，行定格为完成态摘要，不再滚动展示思考行
    steps.shift()?.()
    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('答案')
    })
    expect(host.querySelector('.u-ai-chat__step-line-title')?.textContent).toBe('执行了 1 个步骤')
    expect(host.querySelector('.u-ai-chat__step-line-text')).toBeFalsy()
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
    expect(host.querySelector('.u-ai-chat__step-line-title')?.textContent).toBe('执行了 1 个步骤')
    expect(host.querySelector('.u-ai-chat__reasoning')).toBeFalsy()

    // 展开步骤行后思考块挂载（默认折叠），再点思考头展开内容
    host.querySelector<HTMLElement>('.u-ai-chat__step-line-bar')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__reasoning-title')?.textContent).toContain('思考过程')
    expect(host.querySelector('.u-ai-chat__reasoning-content')).toBeFalsy()
    host.querySelector<HTMLElement>('.u-ai-chat__reasoning-header')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__reasoning-text')?.textContent).toContain(
      '先分析一下问题'
    )
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
        expect(host.querySelector('.u-ai-chat__step-line-title')?.textContent).toBe('思考中…')
      })

      // 思考进行中展开步骤列表：思考块挂载并开始计时
      host.querySelector<HTMLElement>('.u-ai-chat__step-line-bar')!.click()
      await nextTick()
      expect(host.querySelector('.u-ai-chat__reasoning-title')?.textContent).toBe('思考中…')

      // 思考持续超过 1s 后正文开始，思考结束、该段闭合
      await vi.advanceTimersByTimeAsync(1500)
      steps.shift()?.()
      await vi.waitFor(() => {
        expect(host.querySelector('.u-ai-chat__step-line-title')?.textContent).toBe(
          '执行了 1 个步骤'
        )
      })
      expect(host.querySelector('.u-ai-chat__reasoning-title')?.textContent).toBe('思考了 2s')

      // 收起（卸载思考块）再展开（重挂载新实例）：耗时按消息 id 模块级记忆，不回落「思考过程」
      host.querySelector<HTMLElement>('.u-ai-chat__step-line-bar')!.click()
      await nextTick()
      expect(host.querySelector('.u-ai-chat__reasoning')).toBeFalsy()
      host.querySelector<HTMLElement>('.u-ai-chat__step-line-bar')!.click()
      await nextTick()
      expect(host.querySelector('.u-ai-chat__reasoning-title')?.textContent).toBe('思考了 2s')
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

    // 工具已完成、正文未开始：步骤行仍 live 展示该工具
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__step-line-title')?.textContent).toBe('calculate')
    })

    // 用户手动展开步骤列表
    host.querySelector<HTMLElement>('.u-ai-chat__step-line-bar')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__step-line-content')).toBeTruthy()

    // 首条 content 到达、该段闭合：段不重挂（key 稳定），列表保持展开
    steps.shift()?.()
    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('答案是 2')
    })
    expect(host.querySelector('.u-ai-chat__step-line-content')).toBeTruthy()
    expect(host.querySelector('.u-ai-chat__step-line-title')?.textContent).toBe('执行了 1 个步骤')

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

    // 轮次落定后：行显示完成态摘要与步骤计数，过程 DOM（思考块/工具卡片）卸载，答案在行外
    await waitForStepLineSettled(host, 2)
    expect(host.querySelector('.u-ai-chat__step-line-count')?.textContent).toBe('2 步')
    expect(host.querySelector('.u-ai-chat__tool-call')).toBeFalsy()
    expect(host.querySelector('.u-ai-chat__reasoning')).toBeFalsy()
    expect(host.querySelector('.md-stub')?.textContent).toContain('答案是 2')

    // 点击展开：全部步骤可见，思考块默认折叠（可逐层钻取）
    host.querySelector<HTMLElement>('.u-ai-chat__step-line-bar')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__reasoning-title')?.textContent).toContain('思考过程')
    expect(host.querySelector('.u-ai-chat__reasoning-content')).toBeFalsy()
    expect(host.querySelector('.u-ai-chat__tool-call-name')?.textContent).toBe('calculate')

    // 再次收起：过程 DOM 重新卸载
    host.querySelector<HTMLElement>('.u-ai-chat__step-line-bar')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__step-line-content')).toBeFalsy()
    expect(host.querySelector('.u-ai-chat__tool-call')).toBeFalsy()
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

    // 最终答案流式中（仍在运行）：文字已出现，该段闭合定格为完成态
    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('答案是 2')
    })
    expect(host.querySelector('.u-ai-chat__step-line-title')?.textContent).toBe('执行了 1 个步骤')

    // 停跑后维持完成态
    releaseAnswer?.()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__step-line-title')?.textContent).toBe('执行了 1 个步骤')
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
    const bars = [...host.querySelectorAll('.u-ai-chat__step-line')]
    expect(bars).toHaveLength(2)
    expect(bars[0]?.querySelector('.u-ai-chat__step-line-title')?.textContent).toBe(
      '执行了 2 个步骤'
    )
    expect(bars[1]?.querySelector('.u-ai-chat__step-line-title')?.textContent).toBe(
      '执行了 1 个步骤'
    )
    // 中间文本回答渲染在两个步骤行之间
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
    expect(host.querySelector('.u-ai-chat__step-line')).toBeFalsy()
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
      expect(host.querySelector('.u-ai-chat__thinking-icon.is-active')).toBeTruthy()
    })

    steps.shift()?.()
    await vi.waitFor(() => {
      expect(host.querySelector('.md-stub')?.textContent).toContain('答案')
    })
    // 落定后行定格为完成态摘要，思考图标不再活跃
    expect(host.querySelector('.u-ai-chat__thinking-icon.is-active')).toBeFalsy()
    unmount()
  })

  /** happy-dom 无布局：导航需要内容列两侧留白（列宽不足时收起）。
   *  宽度在消息增删时测量（useResizeObserver 之外的兜底路径），须在后续消息到达前 stub 才能被读到 */
  function stubContainerWidth(host: HTMLElement) {
    const container = host.querySelector<HTMLElement>('.u-ai-chat__list .u-scroll__container')!
    Object.defineProperty(container, 'clientWidth', { value: 1200, configurable: true })
  }

  /** 让消息列表进入可滚状态：stub 高度并触发一次滚动事件 */
  async function makeScrollable(host: HTMLElement) {
    const container = host.querySelector<HTMLElement>('.u-ai-chat__list .u-scroll__container')!
    Object.defineProperty(container, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(container, 'clientHeight', { value: 600, configurable: true })
    container.dispatchEvent(new Event('scroll'))
    await nextTick()
    await nextTick()
  }

  it('会话不足 3 轮不出现导航，达到后可滚动才渲染刻度与目录', async () => {
    const transport: ChatTransport = (_req, handlers) => handlers.onTextDelta('收到')
    const { host, chat, unmount } = mountAiChat({ transport })

    chat.value?.send('第一轮')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__message--user')).toBeTruthy()
    })
    expect(host.querySelector('.u-ai-chat__navigator')).toBeFalsy()

    stubContainerWidth(host)
    chat.value?.send('第二轮')
    chat.value?.send('第三轮')
    await vi.waitFor(() => {
      expect(host.querySelectorAll('[data-turn]')).toHaveLength(3)
    })
    // 内容未溢出时不需要目录
    expect(host.querySelector('.u-ai-chat__navigator')).toBeFalsy()

    await makeScrollable(host)
    await vi.waitFor(() => {
      expect(host.querySelectorAll('.u-ai-chat__navigator-tick')).toHaveLength(3)
    })

    // 激活刻度带 is-active（happy-dom 无布局，视口判定落在最后一轮），其前的刻度已读变淡
    const ticks = [...host.querySelectorAll('.u-ai-chat__navigator-tick')]
    expect(ticks[2]!.classList.contains('is-active')).toBe(true)
    expect(ticks[0]!.classList.contains('is-read')).toBe(true)

    // 目录项取用户提问原文，按序号展示；hover 才展开
    host
      .querySelector<HTMLElement>('.u-ai-chat__navigator')!
      .dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }))
    await nextTick()
    const items = [...host.querySelectorAll('.u-ai-chat__navigator-item-text')].map(
      (el) => el.textContent
    )
    expect(items).toEqual(['第一轮', '第二轮', '第三轮'])
    unmount()
  })

  it('点击导航项滚到对应轮次', async () => {
    const transport: ChatTransport = (_req, handlers) => handlers.onTextDelta('收到')
    const { host, chat, unmount } = mountAiChat({ transport })

    stubContainerWidth(host)
    chat.value?.send('第一轮')
    chat.value?.send('第二轮')
    chat.value?.send('第三轮')
    await vi.waitFor(() => {
      expect(host.querySelectorAll('[data-turn]')).toHaveLength(3)
    })
    await makeScrollable(host)

    const turns = [...host.querySelectorAll<HTMLElement>('[data-turn]')]
    const container = host.querySelector<HTMLElement>('.u-ai-chat__list .u-scroll__container')!
    const scrolled: number[] = []
    container.scrollTo = ((options: ScrollToOptions) => {
      scrolled.push(options.top ?? 0)
    }) as typeof container.scrollTo

    host.querySelectorAll<HTMLElement>('.u-ai-chat__navigator-tick')[1]!.click()
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

    await expandStepLine(host)

    expect(host.querySelector('.u-ai-chat__tool-call.is-success')).toBeTruthy()

    // 完成后默认折叠，展开后 render 优先于插槽
    const header = host.querySelector<HTMLElement>('.u-ai-chat__tool-call .u-collapse__header')!
    header.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    await nextTick()
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

    // 最终答案输出后工具卡片收进步骤行，展开后断言
    await expandStepLine(host)

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

    // 卡片已收进步骤行，展开后点击入口
    await expandStepLine(host)

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

    // 卡片已收进步骤行，展开后点击第一张卡片的「查看面板」切回 form
    await expandStepLine(host)

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

    // 卡片已收进步骤行，展开后点击 openPage 卡片的「查看面板」→ 切换并应用 480px
    await expandStepLine(host)

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

  it('面板可全屏与还原，切换聚焦调用时退出全屏', async () => {
    const tools = [pageTool({ render: createArgsView('page-view'), renderTo: 'panel' })]
    const transport = createPageTransport([
      { id: 'c1', arguments: '{"page":"form"}' },
      { id: 'c2', arguments: '{"page":"list"}' }
    ])
    const { host, chat, unmount } = mountAiChat({ transport, tools })

    chat.value?.send('打开表单页和列表页')
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__panel .page-view')).toBeTruthy()
    })
    const layout = host.querySelector<HTMLElement>('.u-ai-chat')!
    expect(layout.style.gridTemplateColumns).toBe('1fr 420px')

    // 点全屏按钮 → 面板挂 is-fullscreen，图标切换为还原语义，关闭按钮仍可达
    const fullscreenBtn = host.querySelector<HTMLElement>('.u-ai-chat__panel-fullscreen')!
    expect(fullscreenBtn.title).toBe('全屏')
    fullscreenBtn.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__panel.is-fullscreen')).toBeTruthy()
    expect(fullscreenBtn.title).toBe('还原')
    expect(host.querySelector('.u-ai-chat__panel-close')).toBeTruthy()

    // 点还原 → 移除 is-fullscreen，列宽不被全屏态污染
    fullscreenBtn.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__panel.is-fullscreen')).toBeFalsy()
    expect(host.querySelector('.u-ai-chat__panel')).toBeTruthy()
    expect(layout.style.gridTemplateColumns).toBe('1fr 420px')

    // 再次全屏后切换聚焦的调用 → 自动退出全屏
    fullscreenBtn.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__panel.is-fullscreen')).toBeTruthy()

    await expandStepLine(host)
    const firstCard = host.querySelectorAll<HTMLElement>('.u-ai-chat__tool-call')[0]!
    const entryBtn = [
      ...firstCard.querySelectorAll<HTMLElement>('.u-ai-chat__tool-call-panel-entry button')
    ].find((btn) => btn.textContent?.includes('查看面板'))!
    entryBtn.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__panel.is-fullscreen')).toBeFalsy()
    expect(host.querySelector('.u-ai-chat__panel .page-view')?.textContent).toContain('form')
    unmount()
  })

  it('输入区使用原生 textarea 与 UFilePicker', () => {
    const { host, unmount } = mountAiChat({ transport: () => {} })

    expect(host.querySelector('textarea.u-ai-chat__input')).toBeTruthy()
    expect(host.querySelector('.u-ai-chat__input-toolbar-left .u-file-picker')).toBeTruthy()
    unmount()
  })

  it('输入法组合态回车不发送：isComposing / keyCode 229 的 Enter 被忽略', async () => {
    const { host, unmount } = mountAiChat({ transport: () => {} })
    const textarea = host.querySelector<HTMLTextAreaElement>('textarea.u-ai-chat__input')!

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

    expect(host.querySelector('.u-ai-chat__message--user')).toBeFalsy()
    expect(textarea.value).toBe('ABnihao')
    expect(composing.defaultPrevented).toBe(false)

    // Safari 顺序：compositionend 之后补发 keyCode=229 的幻影 keydown
    textarea.dispatchEvent(new CompositionEvent('compositionend', { data: 'nihao', bubbles: true }))
    const phantom = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    Object.defineProperty(phantom, 'keyCode', { value: 229 })
    textarea.dispatchEvent(phantom)
    await nextTick()

    expect(host.querySelector('.u-ai-chat__message--user')).toBeFalsy()
    expect(textarea.value).toBe('ABnihao')
    unmount()
  })

  it('组合上屏后的正常回车才发送上屏内容', async () => {
    const { host, unmount } = mountAiChat({
      transport: (_req, handlers) => handlers.onTextDelta('收到')
    })
    const textarea = host.querySelector<HTMLTextAreaElement>('textarea.u-ai-chat__input')!

    textarea.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    textarea.value = '你好'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    textarea.dispatchEvent(new CompositionEvent('compositionend', { data: '你好', bubbles: true }))

    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    )
    await nextTick()

    const bubble = host.querySelector('.u-ai-chat__message--user .u-ai-chat__message-text')
    expect(bubble?.textContent).toBe('你好')
    expect(textarea.value).toBe('')
    unmount()
  })

  it('空白输入（空格/换行）回车与发送按钮均不可发送', async () => {
    const { host, unmount } = mountAiChat({ transport: () => {} })
    const textarea = host.querySelector<HTMLTextAreaElement>('textarea.u-ai-chat__input')!

    textarea.value = '  \n\t '
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    const sendBtn = host.querySelector<HTMLElement>('.u-ai-chat__input-toolbar-right > .u-button')!
    expect(sendBtn.classList.contains('is-disabled')).toBe(true)

    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    )
    await nextTick()

    expect(host.querySelector('.u-ai-chat__message--user')).toBeFalsy()
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
    // 模型选择器在右簇（发送按钮左侧），不在附件侧
    expect(
      host.querySelector('.u-ai-chat__input-toolbar-right .u-ai-chat__model-trigger')
    ).toBeTruthy()
    expect(
      host.querySelector('.u-ai-chat__input-toolbar-left .u-ai-chat__model-trigger')
    ).toBeFalsy()
    // 当前模型无 reasoningLevels，独立推理选择器不渲染
    expect(host.querySelector('.u-ai-chat__reasoning-trigger')).toBeFalsy()
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

    expect(host.querySelector('.u-ai-chat__reasoning-trigger')).toBeFalsy()

    model.value = 'o3-mini'
    await nextTick()

    const trigger = host.querySelector<HTMLElement>(
      '.u-ai-chat__input-toolbar-right .u-ai-chat__reasoning-trigger'
    )
    expect(trigger).toBeTruthy()
    expect(trigger?.textContent).toContain('低')
    expect(reasoningLevel.value).toBe('low')

    // 打开面板切换等级；面板 teleport 到 body 下的 popper 容器
    trigger!.click()
    await vi.waitFor(() => {
      expect(document.querySelector('.u-ai-chat__reasoning-option')).toBeTruthy()
    })
    const highOption = [
      ...document.querySelectorAll<HTMLElement>('.u-ai-chat__reasoning-option')
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
    expect(host.querySelector('.u-ai-chat__usage-trigger')).toBeFalsy()

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

  async function openUsagePanel(host: HTMLElement) {
    const trigger = host.querySelector<HTMLElement>('.u-ai-chat__usage-trigger')
    trigger?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    await nextTick()
    await nextTick()
    const panel = document.body.querySelector('.u-ai-chat__usage-panel')
    const rows: Record<string, string> = {}
    panel?.querySelectorAll('.u-ai-chat__usage-row').forEach((row) => {
      const label = row.querySelector('.u-ai-chat__usage-label')?.textContent ?? ''
      rows[label] = row.querySelector('.u-ai-chat__usage-value')?.textContent ?? ''
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
    // 未收到 usage 时不渲染用量环
    expect(compact.host.querySelector('.u-ai-chat__usage-trigger')).toBeFalsy()
    compact.chat.value?.send('hi')
    await vi.waitFor(() => {
      expect(compact.host.querySelector('.u-ai-chat__usage-trigger')).toBeTruthy()
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
      expect(detail.host.querySelector('.u-ai-chat__usage-trigger')).toBeTruthy()
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
      expect(scaled.host.querySelector('.u-ai-chat__usage-trigger')).toBeTruthy()
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
      expect(noCache.host.querySelector('.u-ai-chat__usage-trigger')).toBeTruthy()
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
      const ring = host.querySelector('.u-ai-chat__usage-ring-value')
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

    // 历史回放（非运行中）步骤行收起：展开后卡片可见
    await expandStepLine(host)

    assertGenericCard(host, 'pending')
    expect(host.querySelector('.u-ai-chat__tool-call-name')?.classList.contains('u-shine')).toBe(
      true
    )
    // 进行中默认折叠
    expect(host.querySelector('.u-ai-chat__tool-call.is-active')).toBeFalsy()

    // 手动展开可查看参数（人读字段行，不是原始 JSON）
    await expandToolCard(host)
    expect(host.textContent).toContain('hi')
    expect(host.textContent).not.toContain('"q": "hi"')

    call.status = 'success'
    call.result = '{"ok":true}'
    await nextTick()
    assertGenericCard(host, 'success')

    // 用户已手动展开过，进入终态后保持展开
    expect(host.textContent).toContain('Ok')
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
    expect(host.textContent).toContain('boom')
    expect(host.textContent).toContain('错误')
    unmount()
  })

  it('通用卡片展示 view，超长结果截断并可展开全文', async () => {
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

    // 人读视图：view 字段名拆词；结果单值直出、超长值截断，不把整段原文倒进会话
    expect(host.textContent).toContain('视图')
    expect(host.textContent).toContain('patch-xyz')
    expect(host.textContent).toContain('Kind')
    expect(host.textContent).not.toContain(long)

    // 「展开」入口看全文，排查问题时信息不丢
    const resultBlock = [...host.querySelectorAll<HTMLElement>('.u-ai-chat__tool-data')].find(
      (el) => el.querySelector('.u-ai-chat__tool-data-title')?.textContent === '结果'
    )!
    const toggle = [
      ...resultBlock.querySelectorAll<HTMLElement>('.u-ai-chat__tool-data-raw-toggle')
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
    // 历史回放的待定调用：步骤行行内先展示工具名，展开后走通用卡片
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__step-line-title')?.textContent).toBe('askQuestion')
    })
    await expandStepLine(host)
    expect(host.querySelector('.u-ai-chat__tool-call-name')?.textContent).toBe('askQuestion')
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
    expect(host.querySelector('.u-ai-chat__job-bar')).toBeFalsy()

    adapter.emit({
      type: 'jobs/snapshot',
      jobs: [{ id: 'j1', kind: 'bash', label: '跑测试', status: 'running' }]
    })
    await nextTick()

    expect(host.querySelector('.u-ai-chat__job-bar')).toBeTruthy()
    expect(host.querySelector('.u-ai-chat__job-bar-label')?.textContent).toContain('跑测试')
    expect(host.querySelector('.u-ai-chat__job-bar-label')?.classList.contains('u-shine')).toBe(
      true
    )
    expect(host.querySelector('.u-ai-chat__job-bar-dot.is-running')).toBeTruthy()

    host.querySelector<HTMLElement>('.u-ai-chat__job-bar-head')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__job-bar-item')).toBeFalsy()
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

    expect(host.querySelector('.u-ai-chat__approval-banner-card')).toBeFalsy()
    expect(host.querySelector('.u-ai-chat__tool-call-confirm')).toBeTruthy()

    adapter.emit({
      type: 'approval/requested',
      approvalId: 'a2',
      toolName: 'deploy',
      reason: '发布到生产',
      rpcId: 'rpc-banner'
    })
    await nextTick()

    expect(host.querySelector('.u-ai-chat__approval-banner-card')).toBeTruthy()
    expect(host.textContent).toContain('发布到生产')

    const allow = [
      ...host.querySelectorAll<HTMLElement>('.u-ai-chat__approval-banner-card button')
    ].find((btn) => btn.textContent?.includes('允许'))!
    click(allow)
    await vi.waitFor(() => {
      expect(adapter.respond).toHaveBeenCalledWith('rpc-banner', true, undefined)
    })
    unmount()
  })

  it('readonly 不展示输入区，欢迎语点击不发送，队列无插队编辑移除', async () => {
    const { host, adapter, unmount } = await mountSession({ readonly: true, welcome: '点我发送' })
    expect(host.querySelector('.u-ai-chat__input-area')).toBeFalsy()

    host.querySelector<HTMLElement>('.u-ai-chat__welcome-item')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-chat__message--user')).toBeFalsy()

    adapter.emit({ type: 'queue/snapshot', items: [{ id: 'q1', content: '排队中' }] })
    await nextTick()
    expect(host.querySelector('.u-ai-chat__queue-text')?.textContent).toContain('排队中')
    expect(host.querySelector('.u-ai-chat__queue-actions')).toBeFalsy()
    unmount()
  })

  it('非只读客户端输入区与欢迎点击发送与现状一致', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('收到')
    }
    const { host, unmount } = mountAiChat({ transport, welcome: '快捷提问' })
    expect(host.querySelector('.u-ai-chat__input-area')).toBeTruthy()
    host.querySelector<HTMLElement>('.u-ai-chat__welcome-item')!.click()
    await nextTick()
    expect(
      host.querySelector('.u-ai-chat__message--user .u-ai-chat__message-bubble')?.textContent
    ).toContain('快捷提问')
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
      expect(host.querySelector('.u-ai-chat__ask-question-q')?.textContent).toContain('Q？')
    })
    click(
      [...host.querySelectorAll<HTMLElement>('.u-ai-chat__ask-question-opt')].find((el) =>
        el.textContent?.includes('A')
      )!
    )
    await nextTick()
    click(
      [...host.querySelectorAll<HTMLElement>('.u-ai-chat__ask-question-actions button')].find(
        (btn) => btn.textContent?.includes('提交')
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
    expect(host.querySelector('.u-ai-chat__ask-question-q')?.textContent).toContain('选一个')

    click(
      [...host.querySelectorAll<HTMLElement>('.u-ai-chat__ask-question-opt')].find((el) =>
        el.textContent?.includes('A')
      )!
    )
    await nextTick()
    click(
      [...host.querySelectorAll<HTMLElement>('.u-ai-chat__ask-question-actions button')].find(
        (btn) => btn.textContent?.includes('提交')
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
