import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import type { AiChatEmits } from '../../types'
import type { ChatTool, ChatTransport, ChatTransportHandlers, ChatTransportRequest } from '../types'
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

  it('生成中忽略重复 send', async () => {
    const emit = createEmit()
    let resolveStream: (() => void) | undefined

    const transport: ChatTransport = (req) => {
      return new Promise<void>((resolve) => {
        resolveStream = resolve
        req.signal.addEventListener('abort', () => resolve(), { once: true })
      })
    }

    const chat = useChat({ props: { transport }, emit })
    chat.send('第一条')
    chat.send('第二条')
    resolveStream?.()

    await waitFinish(emit)
    expect(chat.messages.value.filter((m) => m.role === 'user')).toHaveLength(1)
  })

  it('clear 清空消息', async () => {
    const emit = createEmit()
    const chat = useChat({ props: { transport: textTransport('x') }, emit })

    chat.send('hi')
    await waitFinish(emit)

    chat.clear()
    await nextTick()
    expect(chat.messages.value).toHaveLength(0)
  })
})
