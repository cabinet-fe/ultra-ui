import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, reactive } from 'vue'

import * as toolsModule from '../../tools'
import type { AiChatEmits, AiChatProps } from '../../types'
import {
  createServerTransport,
  isServerTransport,
  type ChatSessionAdapter,
  type ChatSessionEvent
} from '../session'
import type {
  ChatMessage,
  ChatTool,
  ChatTransport,
  ChatTransportHandlers,
  ChatTransportRequest
} from '../types'
import { useChat } from '../use-chat'

const createEmit = () => vi.fn() as unknown as AiChatEmits & ReturnType<typeof vi.fn>

/** 文本流式 mock transport */
const textTransport = (text: string): ChatTransport => {
  return (_req, handlers) => {
    handlers.onTextDelta(text)
  }
}

const waitFinish = async (emit: ReturnType<typeof vi.fn>) => {
  await vi.waitFor(() => {
    expect(emit).toHaveBeenCalledWith('finish', expect.anything())
  })
}

describe('useChat', () => {
  it('流式追加 assistant 消息并发出 finish', async () => {
    const emit = createEmit()
    const chat = useChat({ props: { transport: textTransport('你好') }, emit })

    chat.send('hi')
    await waitFinish(emit)

    const messages = chat.messages.value
    expect(messages).toHaveLength(2)
    expect(messages[0]).toMatchObject({ role: 'user', content: 'hi' })
    expect(messages[1]).toMatchObject({ role: 'assistant', content: '你好', status: 'done' })
    expect(chat.running.value).toBe(false)
    expect(emit).toHaveBeenCalledWith('update:messages', expect.any(Array))
  })

  it('追加思考内容', async () => {
    const emit = createEmit()
    const transport: ChatTransport = (_req, handlers) => {
      handlers.onReasoningDelta?.('想一下')
      handlers.onTextDelta('答案')
    }
    const chat = useChat({ props: { transport }, emit })

    chat.send('1+1=?')
    await waitFinish(emit)

    expect(chat.messages.value[1]).toMatchObject({ reasoning: '想一下', content: '答案' })
  })

  it('工具调用：执行工具、追加 tool 消息并继续第二轮请求', async () => {
    const emit = createEmit()
    const requests: ChatTransportRequest[] = []

    const transport: ChatTransport = (req, handlers) => {
      requests.push(req)
      if (requests.length === 1) {
        handlers.onToolCall?.({ id: 'call-1', name: 'add', arguments: '{"a":1,"b":2}' })
      } else {
        handlers.onTextDelta('结果是 3')
      }
    }

    const execute = vi.fn(({ a, b }: { a: number; b: number }) => a + b)
    const tools: ChatTool[] = [{ name: 'add', description: '加法', parameters: {}, execute }]

    const chat = useChat({ props: { transport, tools }, emit })
    chat.send('算一下')
    await waitFinish(emit)

    expect(execute).toHaveBeenCalledWith(
      { a: 1, b: 2 },
      expect.objectContaining({ toolCall: expect.anything() })
    )
    expect(transport && requests).toHaveLength(2)

    const messages = chat.messages.value
    expect(messages.map((m) => m.role)).toEqual(['user', 'assistant', 'tool', 'assistant'])
    expect(messages[1].toolCalls?.[0]).toMatchObject({ status: 'success', result: '3' })
    expect(messages[2]).toMatchObject({ role: 'tool', toolCallId: 'call-1', content: '3' })

    // 第二轮请求的消息历史中包含工具结果
    const secondReqMessages = requests[1].messages
    expect(secondReqMessages.some((m) => m.role === 'tool' && m.toolCallId === 'call-1')).toBe(true)
  })

  it('needsConfirm 工具：确认后才执行', async () => {
    const emit = createEmit()

    const transport: ChatTransport = (_req, handlers) => {
      handlers.onToolCall?.({ id: 'call-1', name: 'del', arguments: '{}' })
    }

    const execute = vi.fn()
    const tools: ChatTool[] = [
      { name: 'del', description: '删除', parameters: {}, needsConfirm: true, execute }
    ]

    const chat = useChat({ props: { transport, tools }, emit })
    chat.send('删除文件')

    // 等待进入待确认状态
    await vi.waitFor(() => {
      expect(chat.messages.value[1].toolCalls?.[0].status).toBe('awaiting-confirm')
    })
    expect(execute).not.toHaveBeenCalled()

    chat.respondToolCall('call-1', true)
    await vi.waitFor(() => {
      expect(chat.messages.value[1].toolCalls?.[0].status).toBe('success')
    })
    expect(execute).toHaveBeenCalled()
  })

  it('needsConfirm 工具：拒绝后不执行并回灌拒绝信息', async () => {
    const emit = createEmit()
    let round = 0

    const transport: ChatTransport = (_req, handlers) => {
      round++
      if (round === 1) {
        handlers.onToolCall?.({ id: 'call-1', name: 'del', arguments: '{}' })
      } else {
        handlers.onTextDelta('好的，不删了')
      }
    }

    const execute = vi.fn()
    const tools: ChatTool[] = [
      { name: 'del', description: '删除', parameters: {}, needsConfirm: true, execute }
    ]

    const chat = useChat({ props: { transport, tools }, emit })
    chat.send('删除文件')

    await vi.waitFor(() => {
      expect(chat.messages.value[1].toolCalls?.[0].status).toBe('awaiting-confirm')
    })

    chat.respondToolCall('call-1', false)
    await waitFinish(emit)

    const toolCall = chat.messages.value[1].toolCalls?.[0]
    expect(toolCall?.status).toBe('rejected')
    expect(execute).not.toHaveBeenCalled()
    expect(chat.messages.value[2].content).toContain('rejected')
  })

  it('abort 中断生成', async () => {
    const emit = createEmit()

    const transport: ChatTransport = (req, handlers: ChatTransportHandlers) => {
      return new Promise<void>((resolve) => {
        req.signal.addEventListener('abort', () => resolve(), { once: true })
        handlers.onTextDelta('部分')
      })
    }

    const chat = useChat({ props: { transport }, emit })
    chat.send('hi')

    await vi.waitFor(() => {
      expect(chat.messages.value[1].content).toBe('部分')
    })

    chat.abort()
    await vi.waitFor(() => {
      expect(chat.messages.value[1].status).toBe('aborted')
    })
    expect(chat.running.value).toBe(false)
    expect(emit).not.toHaveBeenCalledWith('finish', expect.anything())
  })

  it('transport 报错时标记 error 并发出 error 事件', async () => {
    const emit = createEmit()
    const failure = new Error('网络错误')

    const transport: ChatTransport = (_req, handlers) => {
      handlers.onError?.(failure)
    }

    const chat = useChat({ props: { transport }, emit })
    chat.send('hi')

    await vi.waitFor(() => {
      expect(emit).toHaveBeenCalledWith('error', failure)
    })
    expect(chat.messages.value[1].status).toBe('error')
    expect(chat.running.value).toBe(false)
  })

  it('regenerate 移除最后一轮回复并重新生成', async () => {
    const emit = createEmit()
    let round = 0

    const transport: ChatTransport = (_req, handlers) => {
      round++
      handlers.onTextDelta(`回答${round}`)
    }

    const chat = useChat({ props: { transport }, emit })
    chat.send('问')
    await waitFinish(emit)
    expect(chat.messages.value[1].content).toBe('回答1')

    chat.regenerate()
    await vi.waitFor(() => {
      expect(chat.messages.value[1].content).toBe('回答2')
    })
    expect(chat.messages.value).toHaveLength(2)
  })

  it('生成中 send 进入队列，会话结束后按 FIFO 自动接续', async () => {
    const emit = createEmit()
    const resolvers: (() => void)[] = []

    const transport: ChatTransport = (req, handlers) => {
      const lastUser = [...req.messages].reverse().find((m) => m.role === 'user')
      return new Promise<void>((resolve) => {
        resolvers.push(() => {
          handlers.onTextDelta(`回复:${lastUser?.content}`)
          resolve()
        })
      })
    }

    const chat = useChat({ props: { transport }, emit })
    chat.send('第一条')
    chat.send('第二条')
    chat.send('第三条')

    // 进行中提交的消息进入队列，不直接追加为用户消息
    expect(chat.queue.value.map((q) => q.content)).toEqual(['第二条', '第三条'])
    expect(chat.messages.value.filter((m) => m.role === 'user')).toHaveLength(1)

    resolvers[0]!()
    await vi.waitFor(() => {
      expect(chat.messages.value.filter((m) => m.role === 'user')).toHaveLength(2)
    })
    expect(chat.queue.value.map((q) => q.content)).toEqual(['第三条'])
    expect(chat.messages.value[1]?.content).toBe('回复:第一条')

    resolvers[1]!()
    await vi.waitFor(() => {
      expect(chat.messages.value.filter((m) => m.role === 'user')).toHaveLength(3)
    })

    resolvers[2]!()
    await vi.waitFor(() => {
      expect(chat.running.value).toBe(false)
    })
    expect(chat.queue.value).toHaveLength(0)
    expect(chat.messages.value.at(-1)?.content).toBe('回复:第三条')
  })

  it('startQueued 中断当前会话并插队执行该条，其余保持顺序', async () => {
    const emit = createEmit()
    const resolvers: (() => void)[] = []

    const transport: ChatTransport = (req, handlers) => {
      return new Promise<void>((resolve) => {
        resolvers.push(() => {
          handlers.onTextDelta('ok')
          resolve()
        })
        req.signal.addEventListener('abort', () => resolve(), { once: true })
      })
    }

    const chat = useChat({ props: { transport }, emit })
    chat.send('第一条')
    chat.send('第二条')
    chat.send('第三条')

    const second = chat.queue.value[0]!
    chat.startQueued(second.id)

    // 当前会话中断，第二条插队开始执行，第三条仍在队列
    await vi.waitFor(() => {
      const users = chat.messages.value.filter((m) => m.role === 'user').map((m) => m.content)
      expect(users).toEqual(['第一条', '第二条'])
    })
    expect(chat.messages.value[1]?.status).toBe('aborted')
    expect(chat.queue.value.map((q) => q.content)).toEqual(['第三条'])

    // 第二条完成后自动接续第三条
    resolvers[1]!()
    await vi.waitFor(() => {
      expect(chat.messages.value.filter((m) => m.role === 'user')).toHaveLength(3)
    })
  })

  it('手动 abort 后队列保留且不自动接续', async () => {
    const emit = createEmit()

    const transport: ChatTransport = (req) => {
      return new Promise<void>((resolve) => {
        req.signal.addEventListener('abort', () => resolve(), { once: true })
      })
    }

    const chat = useChat({ props: { transport }, emit })
    chat.send('第一条')
    chat.send('第二条')
    chat.abort()

    await vi.waitFor(() => {
      expect(chat.running.value).toBe(false)
    })
    expect(chat.queue.value.map((q) => q.content)).toEqual(['第二条'])
    expect(chat.messages.value.filter((m) => m.role === 'user')).toHaveLength(1)
    expect(emit).not.toHaveBeenCalledWith('finish', expect.anything())
  })

  it('enqueue 支持 beforeId 锚点插入，保持前后顺序', async () => {
    const emit = createEmit()

    const transport: ChatTransport = (req) => {
      return new Promise<void>((resolve) => {
        req.signal.addEventListener('abort', () => resolve(), { once: true })
      })
    }

    const chat = useChat({ props: { transport }, emit })
    chat.send('第一条')
    chat.enqueue('A')
    chat.enqueue('C')
    const cId = chat.queue.value[1]!.id
    chat.enqueue('B', undefined, cId)

    expect(chat.queue.value.map((q) => q.content)).toEqual(['A', 'B', 'C'])
    chat.abort()
  })

  it('会话出错时不自动消耗队列', async () => {
    const emit = createEmit()

    const transport: ChatTransport = (_req, handlers) => {
      handlers.onError?.(new Error('网络错误'))
    }

    const chat = useChat({ props: { transport }, emit })
    chat.send('第一条')
    chat.send('第二条')

    await vi.waitFor(() => {
      expect(emit).toHaveBeenCalledWith('error', expect.anything())
    })
    expect(chat.running.value).toBe(false)
    expect(chat.queue.value.map((q) => q.content)).toEqual(['第二条'])
  })

  it('clear 同时清空待发送队列', async () => {
    const emit = createEmit()

    const transport: ChatTransport = (req) => {
      return new Promise<void>((resolve) => {
        req.signal.addEventListener('abort', () => resolve(), { once: true })
      })
    }

    const chat = useChat({ props: { transport }, emit })
    chat.send('第一条')
    chat.send('第二条')
    chat.clear()
    await nextTick()

    expect(chat.messages.value).toHaveLength(0)
    expect(chat.queue.value).toHaveLength(0)
    expect(chat.tokenUsage.value).toBeNull()
    expect(chat.lastTurnUsage.value).toBeNull()
  })

  it('请求携带 model 与 reasoningLevel', async () => {
    const emit = createEmit()
    const requests: ChatTransportRequest[] = []

    const transport: ChatTransport = (req, handlers) => {
      requests.push(req)
      handlers.onTextDelta('ok')
    }

    const chat = useChat({
      props: {
        transport,
        models: [
          {
            id: 'gpt-4o',
            providerId: 'openai',
            reasoningLevels: [
              { value: 'low', label: '低' },
              { value: 'high', label: '高' }
            ],
            defaultReasoningLevel: 'low'
          }
        ],
        model: 'gpt-4o',
        reasoningLevel: 'high'
      },
      emit
    })

    chat.send('hi')
    await waitFinish(emit)

    expect(requests[0]).toMatchObject({ model: 'gpt-4o', reasoningLevel: 'high' })
  })

  it('切换模型时校正推理等级', async () => {
    const emit = createEmit()
    const chat = useChat({
      props: {
        transport: textTransport('x'),
        models: [
          {
            id: 'with-reason',
            providerId: 'a',
            reasoningLevels: [
              { value: 'low', label: '低' },
              { value: 'high', label: '高' }
            ],
            defaultReasoningLevel: 'low'
          },
          { id: 'no-reason', providerId: 'a' }
        ],
        model: 'with-reason',
        reasoningLevel: 'high'
      },
      emit
    })

    await nextTick()
    expect(chat.model.value).toBe('with-reason')
    expect(chat.reasoningLevel.value).toBe('high')

    chat.model.value = 'no-reason'
    await nextTick()
    expect(chat.reasoningLevel.value).toBeUndefined()

    chat.model.value = 'with-reason'
    await nextTick()
    expect(chat.reasoningLevel.value).toBe('low')
  })

  it('terminal 工具执行成功后结束对话，不再请求模型生成文字', async () => {
    const emit = createEmit()
    const requests: ChatTransportRequest[] = []

    const transport: ChatTransport = (req, handlers) => {
      requests.push(req)
      handlers.onToolCall?.({ id: 'call-1', name: 'getWeather', arguments: '{"city":"北京"}' })
    }

    const tools: ChatTool[] = [
      {
        name: 'getWeather',
        description: '查天气',
        parameters: {},
        terminal: true,
        execute: () => ({ temperature: 26 })
      }
    ]

    const chat = useChat({ props: { transport, tools }, emit })
    chat.send('北京天气')
    await waitFinish(emit)

    // 只请求一轮；工具结果仍进入消息历史
    expect(requests).toHaveLength(1)
    const messages = chat.messages.value
    expect(messages.map((m) => m.role)).toEqual(['user', 'assistant', 'tool'])
    expect(messages[1].toolCalls?.[0]).toMatchObject({ status: 'success' })
  })

  it('terminal 工具执行失败时仍回灌模型', async () => {
    const emit = createEmit()
    let round = 0

    const transport: ChatTransport = (_req, handlers) => {
      round++
      if (round === 1) {
        handlers.onToolCall?.({ id: 'call-1', name: 'getWeather', arguments: '{}' })
      } else {
        handlers.onTextDelta('没查到，换个城市试试')
      }
    }

    const tools: ChatTool[] = [
      {
        name: 'getWeather',
        description: '查天气',
        parameters: {},
        terminal: true,
        execute: () => {
          throw new Error('城市不存在')
        }
      }
    ]

    const chat = useChat({ props: { transport, tools }, emit })
    chat.send('火星天气')
    await waitFinish(emit)

    expect(round).toBe(2)
    expect(chat.messages.value[1].toolCalls?.[0]).toMatchObject({ status: 'error' })
    expect(chat.messages.value[3]).toMatchObject({
      role: 'assistant',
      content: '没查到，换个城市试试'
    })
  })

  it('模型持续调用工具时达到 maxToolRounds 上限即停止', async () => {
    const emit = createEmit()
    const requests: ChatTransportRequest[] = []

    const transport: ChatTransport = (req, handlers) => {
      requests.push(req)
      handlers.onToolCall?.({ id: `call-${requests.length}`, name: 'noop', arguments: '{}' })
    }

    const tools: ChatTool[] = [
      { name: 'noop', description: '空操作', parameters: {}, execute: () => ({}) }
    ]

    const chat = useChat({ props: { transport, tools, maxToolRounds: 3 }, emit })
    chat.send('hi')
    await waitFinish(emit)

    expect(requests).toHaveLength(3)
    expect(chat.running.value).toBe(false)
  })

  it('受控 v-model:messages：父级回显快照不会冲掉流式中的 assistant 消息', async () => {
    // 模拟受控父级：收到 update:messages 后在后续微任务把快照写回 props（v-model 回显路径）。
    // 时序上回显必然晚于本地 push assistant 占位（同一同步块内），还原真实场景的竞态
    const props = reactive<AiChatProps>({
      transport: async (_req, handlers) => {
        // 让回显先于文本到达（与真实父级 patch 时序一致）
        await Promise.resolve()
        handlers.onTextDelta('回答')
      }
    })
    const emit = ((event: string, payload: unknown) => {
      if (event === 'update:messages') {
        const value = payload as ChatMessage[]
        void Promise.resolve().then(() => {
          props.messages = value
        })
      }
    }) as unknown as AiChatEmits

    const chat = useChat({ props, emit })
    chat.send('hi')

    await vi.waitFor(() => {
      expect(chat.messages.value[1]?.status).toBe('done')
    })

    expect(chat.messages.value.map((m) => m.role)).toEqual(['user', 'assistant'])
    expect(chat.messages.value[1].content).toBe('回答')
    // 最终同步给父级的快照也包含 assistant 消息
    expect(props.messages?.some((m) => m.role === 'assistant' && m.content === '回答')).toBe(true)
  })

  it('累计 onUsage，无 usage 时保持 null；clear 一并重置', async () => {
    const emit = createEmit()
    const requests: ChatTransportRequest[] = []
    const transport: ChatTransport = (req, handlers) => {
      requests.push(req)
      if (requests.length === 1) {
        handlers.onToolCall?.({ id: 'call-1', name: 'add', arguments: '{"a":1,"b":2}' })
        handlers.onUsage?.({
          promptTokens: 10,
          completionTokens: 4,
          totalTokens: 14,
          cacheHitTokens: 6,
          cacheMissTokens: 4
        })
      } else {
        handlers.onTextDelta('3')
        handlers.onUsage?.({
          promptTokens: 20,
          completionTokens: 2,
          totalTokens: 22,
          cacheHitTokens: 12,
          cacheMissTokens: 8
        })
      }
    }
    const tools: ChatTool[] = [
      { name: 'add', description: '加法', parameters: {}, execute: () => 3 }
    ]
    const chat = useChat({ props: { transport, tools }, emit })

    expect(chat.tokenUsage.value).toBeNull()
    chat.send('算一下')
    await waitFinish(emit)

    expect(chat.lastTurnUsage.value).toEqual({
      promptTokens: 30,
      completionTokens: 6,
      totalTokens: 36,
      cacheHitTokens: 18,
      cacheMissTokens: 12
    })
    expect(chat.tokenUsage.value).toEqual(chat.lastTurnUsage.value)

    chat.send('再算')
    await vi.waitFor(() => {
      expect(emit.mock.calls.filter((call) => call[0] === 'finish')).toHaveLength(2)
    })
    expect(chat.lastTurnUsage.value?.totalTokens).toBe(22)
    expect(chat.tokenUsage.value?.totalTokens).toBe(58)
    expect(chat.tokenUsage.value?.cacheHitTokens).toBe(30)

    chat.clear()
    expect(chat.tokenUsage.value).toBeNull()
    expect(chat.lastTurnUsage.value).toBeNull()
  })

  it('transport 不回调 onUsage 时不编造数字', async () => {
    const emit = createEmit()
    const chat = useChat({ props: { transport: textTransport('ok') }, emit })
    chat.send('hi')
    await waitFinish(emit)
    expect(chat.tokenUsage.value).toBeNull()
    expect(chat.lastTurnUsage.value).toBeNull()
  })
})

function createFakeAdapter(options?: {
  history?: ChatSessionEvent[]
}): ChatSessionAdapter & {
  emit: (event: ChatSessionEvent) => void
  disconnect: () => void
  unsubscribed: () => boolean
} {
  let listener: { onEvent(event: ChatSessionEvent): void; onDisconnect?(): void } | undefined
  let unsubscribed = false

  const adapter: ChatSessionAdapter = {
    subscribe(handlers) {
      listener = handlers
      return () => {
        unsubscribed = true
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
    },
    disconnect() {
      listener?.onDisconnect?.()
    },
    unsubscribed: () => unsubscribed
  })
}

async function setupSession(options?: {
  history?: ChatSessionEvent[]
  tools?: AiChatProps['tools']
  models?: AiChatProps['models']
  model?: string
}) {
  const adapter = createFakeAdapter({ history: options?.history })
  const props = reactive<AiChatProps>({
    transport: createServerTransport(adapter),
    tools: options?.tools,
    models: options?.models,
    model: options?.model
  })
  const emit = createEmit()
  const chat = useChat({ props, emit })
  await vi.waitFor(() => {
    expect(adapter.fetchHistory).toHaveBeenCalled()
  })
  return { adapter, props, emit, chat }
}

describe('useChat session', () => {
  it('函数 transport 时 isServerTransport 为 false', () => {
    const emit = createEmit()
    const transport = textTransport('x')
    useChat({ props: { transport }, emit })
    expect(isServerTransport(transport)).toBe(false)
  })

  it('open + fetchHistory 播种 messages；函数 transport 不调用 open/fetchHistory', async () => {
    const { chat, adapter } = await setupSession({
      history: [{ type: 'user/message', messageId: 'u1', seq: 1, content: '历史' }]
    })
    expect(isServerTransport(createServerTransport(adapter))).toBe(true)
    expect(chat.messages.value).toEqual([{ id: 'u1', role: 'user', content: '历史' }])

    const fnTransport = textTransport('ok')
    const fetchHistory = vi.fn()
    const open = vi.fn()
    useChat({
      props: { transport: Object.assign(fnTransport, { open, fetchHistory }) },
      emit: createEmit()
    })
    await Promise.resolve()
    expect(open).not.toHaveBeenCalled()
    expect(fetchHistory).not.toHaveBeenCalled()
  })

  it('transport 更换或卸载时调用 disposer', async () => {
    const adapter1 = createFakeAdapter()
    const adapter2 = createFakeAdapter()
    const props = reactive<AiChatProps>({ transport: createServerTransport(adapter1) })
    const scope = effectScope()
    scope.run(() => {
      useChat({ props, emit: createEmit() })
    })
    await vi.waitFor(() => expect(adapter1.fetchHistory).toHaveBeenCalled())
    expect(adapter1.unsubscribed()).toBe(false)

    props.transport = createServerTransport(adapter2)
    await vi.waitFor(() => expect(adapter2.fetchHistory).toHaveBeenCalled())
    expect(adapter1.unsubscribed()).toBe(true)

    scope.stop()
    expect(adapter2.unsubscribed()).toBe(true)
  })

  it('send 只调 session.send，不带全量历史、不执行 execute、不注入内置工具', async () => {
    const spy = vi.spyOn(toolsModule, 'createBuiltinTools')
    const execute = vi.fn()
    const { chat, adapter } = await setupSession({
      tools: [{ name: 'add', description: '加法', parameters: {}, execute }]
    })
    spy.mockClear()

    chat.send('hello')
    expect(adapter.send).toHaveBeenCalledWith('hello', undefined)
    expect(chat.messages.value).toHaveLength(0)

    adapter.emit({ type: 'user/message', messageId: 'u1', seq: 1, content: 'hello' })
    adapter.emit({ type: 'tool/call', callId: 'c1', name: 'add', arguments: '{"a":1}', seq: 2 })
    expect(execute).not.toHaveBeenCalled()
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('abort 调 session.cancel；running 由事件与 onDisconnect 驱动', async () => {
    const { chat, adapter } = await setupSession()
    expect(chat.running.value).toBe(false)

    adapter.emit({ type: 'running', running: true })
    expect(chat.running.value).toBe(true)

    chat.abort()
    expect(adapter.cancel).toHaveBeenCalledTimes(1)

    adapter.emit({ type: 'finish' })
    expect(chat.running.value).toBe(false)

    adapter.emit({ type: 'running', running: true })
    adapter.emit({ type: 'error', code: 'x', message: '失败' })
    expect(chat.running.value).toBe(false)

    adapter.emit({ type: 'running', running: true })
    adapter.disconnect()
    await vi.waitFor(() => {
      expect(chat.running.value).toBe(false)
    })
  })

  it('队列只认 snapshot；enqueue / startQueued / removeQueued / regenerate 为 no-op', async () => {
    const { chat, adapter } = await setupSession()
    adapter.emit({ type: 'queue/snapshot', items: [{ id: 'q1', content: '排队' }] })
    expect(chat.queue.value).toEqual([{ id: 'q1', content: '排队' }])

    chat.enqueue('本地')
    chat.startQueued('q1')
    expect(chat.removeQueued('q1')).toBeUndefined()
    expect(chat.queue.value).toEqual([{ id: 'q1', content: '排队' }])
    expect(adapter.send).not.toHaveBeenCalled()

    adapter.emit({ type: 'user/message', messageId: 'u1', seq: 1, content: '问' })
    adapter.emit({ type: 'assistant/message', messageId: 'a1', seq: 2, content: '答' })
    chat.regenerate()
    expect(chat.messages.value).toHaveLength(2)
    expect(adapter.send).not.toHaveBeenCalled()
  })

  it('clear 只清本地渲染面，不调 cancel', async () => {
    const { chat, adapter } = await setupSession()
    adapter.emit({ type: 'user/message', messageId: 'u1', seq: 1, content: 'hi' })
    adapter.emit({
      type: 'jobs/snapshot',
      jobs: [{ id: 'j1', kind: 'bash', label: '跑', status: 'running' }]
    })
    adapter.emit({
      type: 'projection',
      key: 'tokenUsage',
      seq: 2,
      value: { promptTokens: 1, completionTokens: 2, totalTokens: 3 }
    })
    adapter.emit({ type: 'projection', key: 'title', seq: 3, value: '标题' })
    adapter.emit({ type: 'projection', key: 'other', seq: 4, value: 1 })

    expect(chat.jobs.value).toHaveLength(1)
    expect(chat.title.value).toBe('标题')
    expect(chat.projections.value.other).toBe(1)
    expect(chat.tokenUsage.value?.totalTokens).toBe(3)

    chat.clear()
    expect(adapter.cancel).not.toHaveBeenCalled()
    expect(chat.messages.value).toHaveLength(0)
    expect(chat.queue.value).toHaveLength(0)
    expect(chat.jobs.value).toHaveLength(0)
    expect(chat.tokenUsage.value).toBeNull()
    expect(chat.projections.value).toEqual({})
    expect(chat.title.value).toBeNull()
  })

  it('approval 与 question 走 session.respond，不执行客户端工具', async () => {
    const execute = vi.fn()
    const { chat, adapter } = await setupSession({
      tools: [{ name: 'del', description: '删', parameters: {}, execute }]
    })

    adapter.emit({ type: 'tool/call', callId: 'c1', name: 'del', arguments: '{}', seq: 1 })
    adapter.emit({
      type: 'approval/requested',
      approvalId: 'ap1',
      toolName: 'del',
      callId: 'c1',
      rpcId: 'rpc-call'
    })
    expect(chat.messages.value[0]?.toolCalls?.[0]?.status).toBe('awaiting-confirm')
    chat.respondToolCall('c1', true)
    await vi.waitFor(() => {
      expect(adapter.respond).toHaveBeenCalledWith('rpc-call', true, undefined)
    })
    expect(execute).not.toHaveBeenCalled()

    adapter.emit({
      type: 'approval/requested',
      approvalId: 'ap2',
      toolName: 'del',
      rpcId: 'rpc-banner'
    })
    expect(chat.pendingApprovals.value.some((a) => a.rpcId === 'rpc-banner' && !a.callId)).toBe(
      true
    )
    chat.respondSession('rpc-banner', false)
    await vi.waitFor(() => {
      expect(adapter.respond).toHaveBeenCalledWith('rpc-banner', false, undefined)
    })

    adapter.emit({
      type: 'question/requested',
      rpcId: 'rpc-q',
      questions: [{ question: '选一个', options: ['A', 'B'] }]
    })
    expect(chat.pendingQuestion.value?.rpcId).toBe('rpc-q')
    chat.respondSession('rpc-q', true, [{ question: '选一个', answer: 'A' }])
    await vi.waitFor(() => {
      expect(adapter.respond).toHaveBeenCalledWith('rpc-q', true, [
        { question: '选一个', answer: 'A' }
      ])
    })
  })

  it('已 open 时模型切换走 selectModel(providerId, modelId)', async () => {
    const { chat, adapter } = await setupSession({
      models: [
        { id: 'm1', providerId: 'p1' },
        { id: 'm2', providerId: 'p1' }
      ],
      model: 'm1'
    })
    expect(adapter.selectModel).not.toHaveBeenCalled()

    chat.model.value = 'm2'
    await nextTick()
    expect(adapter.selectModel).toHaveBeenCalledWith('p1', 'm2')
  })
})
