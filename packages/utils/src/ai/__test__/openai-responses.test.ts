import { describe, expect, it, vi } from 'vite-plus/test'

import { buildOpenAIResponsesBody, parseOpenAIResponsesSSEStream } from '../openai-responses'
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

describe('buildOpenAIResponsesBody', () => {
  it('组装 model / input / instructions，缺省 stream=false 且不带 tools', () => {
    const body = buildOpenAIResponsesBody({
      model: 'gpt-5',
      messages: [{ role: 'user', content: 'hi' }],
      systemPrompt: 'sys'
    })

    expect(body).toMatchObject({
      model: 'gpt-5',
      stream: false,
      instructions: 'sys',
      input: [{ role: 'user', content: 'hi' }]
    })
    expect(body.tools).toBeUndefined()
    expect(body.messages).toBeUndefined()
  })

  it('无 systemPrompt 时不写 instructions；工具为扁平结构（name 直挂）', () => {
    const body = buildOpenAIResponsesBody({
      model: 'gpt-5',
      messages: [{ role: 'user', content: 'hi' }],
      tools: [{ name: 'get_weather', description: '查天气', parameters: { type: 'object' } }]
    })

    expect(body.instructions).toBeUndefined()
    expect(body.tools).toEqual([
      {
        type: 'function',
        name: 'get_weather',
        description: '查天气',
        parameters: { type: 'object' }
      }
    ])
  })

  it('用户附件：图片转 input_image（image_url 为字符串），文本文件转附件块拼进 input_text', () => {
    const body = buildOpenAIResponsesBody({
      model: 'm',
      messages: [
        {
          role: 'user',
          content: '看图',
          attachments: [
            { mimeType: 'image/png', dataUrl: 'data:image/png;base64,xxx' },
            { name: 'a.txt', mimeType: 'text/plain', dataUrl: '', textContent: 'hello' }
          ]
        }
      ]
    })

    const input = body.input as { role: string; content: { type: string }[] }[]
    expect(input).toHaveLength(1)
    expect(input[0]!.role).toBe('user')
    expect(input[0]!.content).toEqual([
      { type: 'input_text', text: '[附件: a.txt]\n```\nhello\n```\n\n看图' },
      { type: 'input_image', image_url: 'data:image/png;base64,xxx' }
    ])
  })

  it('工具调用轮次转 function_call / function_call_output，空 assistant 占位被跳过', () => {
    const messages: AiMessage[] = [
      { role: 'user', content: '北京天气' },
      { role: 'assistant', content: '' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [{ id: 'call_1', name: 'get_weather', arguments: '{"city":"北京"}' }]
      },
      { role: 'tool', content: '{"temp":25}', toolCallId: 'call_1' },
      { role: 'assistant', content: '北京 25 度' }
    ]
    const body = buildOpenAIResponsesBody({ model: 'm', messages })

    expect(body.input).toEqual([
      { role: 'user', content: '北京天气' },
      {
        type: 'function_call',
        call_id: 'call_1',
        name: 'get_weather',
        arguments: '{"city":"北京"}'
      },
      { type: 'function_call_output', call_id: 'call_1', output: '{"temp":25}' },
      { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: '北京 25 度' }] }
    ])
  })

  it('缺 tool 响应的调用补齐 Error: Aborted 兜底输出', () => {
    const messages: AiMessage[] = [
      { role: 'user', content: 'hi' },
      {
        role: 'assistant',
        content: '',
        toolCalls: [
          { id: 'call_1', name: 'a', arguments: '{}' },
          { id: 'call_2', name: 'b', arguments: '{}' }
        ]
      },
      { role: 'assistant', content: 'done' }
    ]
    const body = buildOpenAIResponsesBody({ model: 'm', messages })

    expect(body.input).toEqual([
      { role: 'user', content: 'hi' },
      { type: 'function_call', call_id: 'call_1', name: 'a', arguments: '{}' },
      { type: 'function_call', call_id: 'call_2', name: 'b', arguments: '{}' },
      { type: 'function_call_output', call_id: 'call_1', output: 'Error: Aborted' },
      { type: 'function_call_output', call_id: 'call_2', output: 'Error: Aborted' },
      { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'done' }] }
    ])
  })

  it('缺省将 reasoningLevel 写入 reasoning.effort，applyReasoning 可自定义', () => {
    const body = buildOpenAIResponsesBody({
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      reasoningLevel: 'high'
    })
    expect(body.reasoning).toEqual({ effort: 'high' })

    const custom = buildOpenAIResponsesBody({
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      reasoningLevel: '8k',
      applyReasoning: (level, b) => {
        b.thinking = { budget: level }
      }
    })
    expect(custom.thinking).toEqual({ budget: '8k' })
    expect(custom.reasoning).toBeUndefined()
  })

  it('extraBody 展开在最前，同名字段以构造结果为准', () => {
    const body = buildOpenAIResponsesBody({
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      stream: true,
      extraBody: { temperature: 0.7, model: 'ignored', instructions: 'overridden' }
    })

    expect(body).toMatchObject({
      model: 'm',
      stream: true,
      temperature: 0.7,
      instructions: 'overridden'
    })
  })
})

describe('parseOpenAIResponsesSSEStream', () => {
  it('output_text.delta 逐帧触发 onTextDelta，跨 chunk 切分可解析', async () => {
    const chunks = [
      'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"你"}\n\n',
      'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"好"}\n\nevent: response.completed\ndata: {"type":"response.completed","response":{}}\n\n'
    ]
    const handlers = baseHandlers()
    await parseOpenAIResponsesSSEStream(sseStream(chunks), undefined, handlers)

    expect(handlers.onTextDelta).toHaveBeenNthCalledWith(1, '你')
    expect(handlers.onTextDelta).toHaveBeenNthCalledWith(2, '好')
  })

  it('reasoning_summary_text / reasoning_text 增量都路由到 onReasoningDelta', async () => {
    const sse =
      'data: {"type":"response.reasoning_summary_text.delta","delta":"先查天气"}\n\n' +
      'data: {"type":"response.reasoning_text.delta","delta":"原始思考"}\n\n'
    const handlers = baseHandlers()
    await parseOpenAIResponsesSSEStream(sseStream([sse]), undefined, handlers)

    expect(handlers.onReasoningDelta).toHaveBeenNthCalledWith(1, '先查天气')
    expect(handlers.onReasoningDelta).toHaveBeenNthCalledWith(2, '原始思考')
  })

  it('function_call 以 output_item.done 的完整 item 为准，只抛一次完整 onToolCall', async () => {
    const sse =
      'data: {"type":"response.output_item.added","item":{"id":"fc_1","type":"function_call","call_id":"call_1","name":"get_weather","arguments":""}}\n\n' +
      'data: {"type":"response.function_call_arguments.delta","item_id":"fc_1","delta":"{\\"city\\""}\n\n' +
      'data: {"type":"response.function_call_arguments.delta","item_id":"fc_1","delta":":\\"北京\\"}"}\n\n' +
      'data: {"type":"response.output_item.done","item":{"id":"fc_1","type":"function_call","call_id":"call_1","name":"get_weather","arguments":"{\\"city\\":\\"北京\\"}"}}\n\n' +
      'data: {"type":"response.completed","response":{}}\n\n'
    const handlers = baseHandlers()
    await parseOpenAIResponsesSSEStream(sseStream([sse]), undefined, handlers)

    expect(handlers.onToolCall).toHaveBeenCalledTimes(1)
    expect(handlers.onToolCall).toHaveBeenCalledWith({
      id: 'call_1',
      name: 'get_weather',
      arguments: '{"city":"北京"}'
    })
  })

  it('缺 output_item.done 时流末兜底 flush 累积的调用；多个调用各自独立累积', async () => {
    const sse =
      'data: {"type":"response.output_item.added","item":{"id":"fc_1","type":"function_call","call_id":"call_1","name":"alpha","arguments":""}}\n\n' +
      'data: {"type":"response.function_call_arguments.delta","item_id":"fc_1","delta":"{\\"x\\":\"}\n\n' +
      'data: {"type":"response.output_item.added","item":{"id":"fc_2","type":"function_call","call_id":"call_2","name":"beta","arguments":""}}\n\n' +
      'data: {"type":"response.function_call_arguments.delta","item_id":"fc_1","delta":"1}"}\n\n' +
      'data: {"type":"response.function_call_arguments.delta","item_id":"fc_2","delta":"{\\"y\\":2}"}\n\n' +
      'data: {"type":"response.completed","response":{}}\n\n'
    const handlers = baseHandlers()
    await parseOpenAIResponsesSSEStream(sseStream([sse]), undefined, handlers)

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

  it('completed / incomplete 的 usage 解析 input_tokens 风格并推导缓存未命中', async () => {
    const sse =
      'data: {"type":"response.completed","response":{"usage":{"input_tokens":10,"output_tokens":5,"total_tokens":15,"input_tokens_details":{"cached_tokens":4}}}}\n\n' +
      'data: {"type":"response.incomplete","response":{"usage":{"input_tokens":8,"output_tokens":2,"total_tokens":10}}}\n\n'
    const handlers = baseHandlers()
    await parseOpenAIResponsesSSEStream(sseStream([sse]), undefined, handlers)

    expect(handlers.onUsage).toHaveBeenCalledTimes(2)
    expect(handlers.onUsage).toHaveBeenNthCalledWith(1, {
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
      cacheHitTokens: 4,
      cacheMissTokens: 6
    })
    expect(handlers.onUsage).toHaveBeenNthCalledWith(2, {
      promptTokens: 8,
      completionTokens: 2,
      totalTokens: 10
    })
  })

  it('response.failed / error 事件抛出异常，由请求层统一报错', async () => {
    const failed =
      'data: {"type":"response.failed","response":{"error":{"code":"server_error","message":"内部错误"}}}\n\n'
    await expect(
      parseOpenAIResponsesSSEStream(sseStream([failed]), undefined, baseHandlers())
    ).rejects.toThrow(/内部错误/)

    const errored = 'data: {"type":"error","code":"invalid_request","message":"参数错误"}\n\n'
    await expect(
      parseOpenAIResponsesSSEStream(sseStream([errored]), undefined, baseHandlers())
    ).rejects.toThrow(/参数错误/)
  })

  it('[DONE] 与未知事件、非法 JSON 帧被忽略', async () => {
    const sse =
      'data: [DONE]\n\n' +
      'data: not-json\n\n' +
      'data: {"type":"response.created","response":{}}\n\n' +
      'data: {"type":"response.output_text.done","text":"完整文本"}\n\n'
    const handlers = baseHandlers()
    await expect(
      parseOpenAIResponsesSSEStream(sseStream([sse]), undefined, handlers)
    ).resolves.toBeUndefined()
    expect(handlers.onTextDelta).not.toHaveBeenCalled()
  })
})
