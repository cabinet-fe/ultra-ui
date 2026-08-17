import { describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, type PropType } from 'vue'

import type { ChatTool, ChatToolCall, ChatTransport } from '../../../chat/types'
import type { ChatModelOption } from '../../../providers'
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

function mountAiChat(options: {
  transport: ChatTransport
  tools?: ChatTool[]
  welcome?: string | string[]
  models?: ChatModelOption[]
  model?: string
  reasoningLevel?: string
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
          reasoningLevel: options.reasoningLevel
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

    const body = host.querySelector('.u-ai-chat__tool-call .u-ai-chat__tool-call-body')
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

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__tool-call-name')?.textContent).toBe('搜索')
      expect(host.querySelector('.custom-tool-icon')).toBeTruthy()
    })
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

    // running 时 render 即渲染（render 工具默认不折叠）
    await vi.waitFor(() => {
      expect(host.querySelector('.weather-view')).toBeTruthy()
    })

    // 完成后保持展开，默认参数/结果区被替换
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__tool-call.is-success.is-expanded')).toBeTruthy()
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

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__tool-call.is-success.is-expanded')).toBeTruthy()
    })
    expect(
      host.querySelector('.u-ai-chat__tool-call .u-ai-chat__tool-call-body')?.textContent
    ).toContain('"value": 2')
    unmount()
  })

  it('render 工具设置 autoCollapse: true 后完成即折叠', async () => {
    const tools = [weatherTool({ render: createResultView('weather-view'), autoCollapse: true })]
    const { host, chat, unmount } = mountAiChat({ transport: createWeatherTransport(), tools })

    chat.value?.send('北京天气')

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__tool-call.is-success')).toBeTruthy()
    })
    await nextTick()
    expect(host.querySelector('.u-ai-chat__tool-call.is-expanded')).toBeFalsy()
    const body = host.querySelector('.u-ai-chat__tool-call .u-ai-chat__tool-call-body')
    expect(body?.getAttribute('aria-hidden')).toBe('true')
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

    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__tool-call.is-success')).toBeTruthy()
    })
    expect(host.querySelector('.weather-view')).toBeTruthy()
    expect(host.querySelector('.slot-view')).toBeFalsy()
    unmount()
  })

  it('输入区使用原生 textarea 与 UFilePicker', () => {
    const { host, unmount } = mountAiChat({ transport: () => {} })

    expect(host.querySelector('textarea.u-ai-chat__input')).toBeTruthy()
    expect(host.querySelector('.u-ai-chat__input-toolbar-left .u-file-picker')).toBeTruthy()
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

  it('welcome 数组渲染为可点击卡片，点击即发送', async () => {
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onTextDelta('收到')
    }
    const { host, unmount } = mountAiChat({ transport, welcome: ['第一条建议', '第二条建议'] })
    await nextTick()

    const items = [...host.querySelectorAll<HTMLElement>('.u-ai-chat__welcome-item')]
    expect(items.map((el) => el.textContent)).toEqual(['第一条建议', '第二条建议'])

    items[0]!.click()
    await nextTick()

    // 点击后该文案作为用户消息发送，欢迎区消失
    expect(host.querySelector('.u-ai-chat__welcome')).toBeFalsy()
    const userBubble = host.querySelector('.u-ai-chat__message--user .u-ai-chat__message-bubble')
    expect(userBubble?.textContent).toContain('第一条建议')
    unmount()
  })

  it('生成中在列表底部展示「工作中…」指示，结束后消失', async () => {
    const transport: ChatTransport = (req) => {
      return new Promise<void>((resolve) => {
        req.signal.addEventListener('abort', () => resolve(), { once: true })
      })
    }
    const { host, chat, unmount } = mountAiChat({ transport })

    expect(host.querySelector('.u-ai-chat__working')).toBeFalsy()

    chat.value?.send('hi')
    await nextTick()

    const working = host.querySelector('.u-ai-chat__working')
    expect(working).toBeTruthy()
    expect(working?.textContent).toContain('工作中')
    expect(working?.querySelector('canvas.u-ai-orb')).toBeTruthy()

    chat.value?.abort()
    await vi.waitFor(() => {
      expect(host.querySelector('.u-ai-chat__working')).toBeFalsy()
    })
    unmount()
  })
})
