import { describe, expect, it, vi } from 'vite-plus/test'

import { buildOpenAIBody, parseOpenAICompletionText, parseOpenAISSEStream } from '../openai'
import type { AiMessage, AiStreamHandlers } from '../types'

function baseHandlers(): AiStreamHandlers {
  return { onTextDelta: vi.fn(), onReasoningDelta: vi.fn(), onToolCall: vi.fn(), onUsage: vi.fn() }
}

/** 把字符串切成多个网络分片，验证跨 chunk 的 SSE 解析 */
function sseStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let index = 0
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) controller.enqueue(encoder.encode(chunks[index++]))
      else controller.close()
    }
  })
}

describe('buildOpenAIBody', () => {
  it('组装 system / user 消息，缺省 stream=false 且不带 stream_options / tools', () => {
    const body = buildOpenAIBody({
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      systemPrompt: 'sys'
    })

    expect(body).toMatchObject({
      model: 'm',
      stream: false,
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'hi' }
      ]
    })
    expect(body.stream_options).toBeUndefined()
    expect(body.tools).toBeUndefined()
  })

  it('stream=true 时带 stream_options.include_usage，extraBody 展开且同名字段以构造结果为准', () => {
    const body = buildOpenAIBody({
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      stream: true,
      extraBody: { temperature: 0.7, model: 'ignored', stream_options: { custom: 1 } }
    })

    expect(body).toMatchObject({
      model: 'm',
      stream: true,
      temperature: 0.7,
      stream_options: { custom: 1, include_usage: true }
    })
  })

  it('缺省将 reasoningLevel 写入 reasoning_effort，applyReasoning 可自定义', () => {
    const body = buildOpenAIBody({
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      reasoningLevel: 'high'
    })
    expect(body.reasoning_effort).toBe('high')

    const custom = buildOpenAIBody({
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      reasoningLevel: '8k',
      applyReasoning: (level, target) => {
        target.thinking = { budget: level }
      }
    })
    expect(custom.thinking).toEqual({ budget: '8k' })
    expect(custom.reasoning_effort).toBeUndefined()
  })

  it('消息与工具转 OpenAI 格式：附件转 image_url、assistant 带 tool_calls、tool 消息带 tool_call_id', () => {
    const messages: AiMessage[] = [
      { role: 'user', content: '看图', attachments: [{ dataUrl: 'data:image/png;base64,xxx' }] },
      { role: 'assistant', content: '', toolCalls: [{ id: 'c1', name: 'f', arguments: '{}' }] },
      { role: 'tool', content: 'result', toolCallId: 'c1' }
    ]

    const body = buildOpenAIBody({
      model: 'm',
      messages,
      tools: [{ name: 'f', description: 'd', parameters: { type: 'object' } }]
    })

    expect(body.messages).toEqual([
      {
        role: 'user',
        content: [
          { type: 'text', text: '看图' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,xxx' } }
        ]
      },
      {
        role: 'assistant',
        content: '',
        tool_calls: [{ id: 'c1', type: 'function', function: { name: 'f', arguments: '{}' } }]
      },
      { role: 'tool', tool_call_id: 'c1', content: 'result' }
    ])
    expect(body.tools).toEqual([
      {
        type: 'function',
        function: { name: 'f', description: 'd', parameters: { type: 'object' } }
      }
    ])
  })
})

describe('parseOpenAISSEStream', () => {
  it('跨网络分片解析 data: 帧，[DONE] 后正常结束', async () => {
    const handlers = baseHandlers()
    await parseOpenAISSEStream(
      sseStream([
        'data: {"choices":[{"delta":{"content":"He',
        'llo"}}]}\n\nda',
        'ta: {"choices":[{"delta":{"content":"!"}}]}\n\ndata: [DONE]\n\n'
      ]),
      undefined,
      handlers
    )

    expect(handlers.onTextDelta).toHaveBeenCalledTimes(2)
    expect(handlers.onTextDelta).toHaveBeenNthCalledWith(1, 'Hello')
    expect(handlers.onTextDelta).toHaveBeenNthCalledWith(2, '!')
    expect(handlers.onUsage).not.toHaveBeenCalled()
  })

  it('兼容 reasoning_content 与 reasoning 两种思考增量字段', async () => {
    const handlers = baseHandlers()
    await parseOpenAISSEStream(
      sseStream([
        'data: {"choices":[{"delta":{"reasoning_content":"想"}}]}\n\n',
        'data: {"choices":[{"delta":{"reasoning":"再想"}}]}\n\n'
      ]),
      undefined,
      handlers
    )

    expect(handlers.onTextDelta).not.toHaveBeenCalled()
    expect(handlers.onReasoningDelta).toHaveBeenNthCalledWith(1, '想')
    expect(handlers.onReasoningDelta).toHaveBeenNthCalledWith(2, '再想')
  })

  it('解析末包 usage（含缓存命中 / 未命中），无 usage 不回调', async () => {
    const handlers = baseHandlers()
    await parseOpenAISSEStream(
      sseStream([
        'data: {"choices":[{"delta":{"content":"hi"}}]}\n\n',
        'data: {"choices":[],"usage":{"prompt_tokens":12,"completion_tokens":3,"total_tokens":15,"prompt_tokens_details":{"cached_tokens":8},"prompt_cache_miss_tokens":4}}\n\n',
        'data: [DONE]\n\n'
      ]),
      undefined,
      handlers
    )

    expect(handlers.onUsage).toHaveBeenCalledTimes(1)
    expect(handlers.onUsage).toHaveBeenCalledWith({
      promptTokens: 12,
      completionTokens: 3,
      totalTokens: 15,
      cacheHitTokens: 8,
      cacheMissTokens: 4
    })
  })

  it('仅有 cached_tokens 时由 prompt − 命中得到未命中', async () => {
    const handlers = baseHandlers()
    await parseOpenAISSEStream(
      sseStream([
        'data: {"choices":[{"delta":{"content":"a"}}],"usage":{"prompt_tokens":10,"completion_tokens":1,"total_tokens":11,"prompt_tokens_details":{"cached_tokens":7}}}\n\n'
      ]),
      undefined,
      handlers
    )

    expect(handlers.onUsage).toHaveBeenCalledWith({
      promptTokens: 10,
      completionTokens: 1,
      totalTokens: 11,
      cacheHitTokens: 7,
      cacheMissTokens: 3
    })
  })

  it('tool_calls 参数分片跨 chunk 累积，多个调用按 index 顺序完整抛出', async () => {
    const handlers = baseHandlers()
    await parseOpenAISSEStream(
      sseStream([
        'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"alpha","arguments":""}}]}}]}\n\n',
        'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"x\\":1}"}}]}}]}\n\n',
        'data: {"choices":[{"delta":{"tool_calls":[{"index":1,"id":"call_2","function":{"name":"beta","arguments":"{\\"y\\":2}"}}]}}]}\n\n',
        'data: [DONE]\n\n'
      ]),
      undefined,
      handlers
    )

    expect(handlers.onToolCall).toHaveBeenCalledTimes(2)
    expect(handlers.onToolCall).toHaveBeenNthCalledWith(1, {
      id: 'call_1',
      name: 'alpha',
      arguments: '{"x":1}'
    })
    expect(handlers.onToolCall).toHaveBeenNthCalledWith(2, {
      id: 'call_2',
      name: 'beta',
      arguments: '{"y":2}'
    })
  })

  it('signal 已中断时不再处理后续分片', async () => {
    const handlers = baseHandlers()
    const controller = new AbortController()
    controller.abort()

    await parseOpenAISSEStream(
      sseStream(['data: {"choices":[{"delta":{"content":"no"}}]}\n\n']),
      controller.signal,
      handlers
    )

    expect(handlers.onTextDelta).not.toHaveBeenCalled()
  })
})

describe('parseOpenAICompletionText', () => {
  it('取 choices[0].message.content 作为完整文本', () => {
    expect(
      parseOpenAICompletionText({ choices: [{ message: { role: 'assistant', content: '答案' } }] })
    ).toBe('答案')
    expect(parseOpenAICompletionText({ choices: [{ message: { content: '' } }] })).toBe('')
  })

  it('形状不含可解析文本时返回 undefined', () => {
    expect(parseOpenAICompletionText({ choices: [] })).toBeUndefined()
    expect(parseOpenAICompletionText({ choices: [{ message: {} }] })).toBeUndefined()
    expect(parseOpenAICompletionText('oops')).toBeUndefined()
  })
})
