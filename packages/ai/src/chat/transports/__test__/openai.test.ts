import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import type { ChatTransportHandlers } from '../../types'
import { createOpenAITransport } from '../openai'

const baseHandlers = (): ChatTransportHandlers => ({
  onTextDelta: vi.fn(),
  onReasoningDelta: vi.fn(),
  onToolCall: vi.fn(),
  onUsage: vi.fn(),
  onError: vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('createOpenAITransport', () => {
  it('providers 为空时抛错', () => {
    expect(() => createOpenAITransport({ providers: [] })).toThrow(/providers 不能为空/)
  })

  it('跨 Provider 模型 id 重复时抛错', () => {
    expect(() =>
      createOpenAITransport({
        providers: [
          {
            id: 'a',
            endpoint: 'https://a.example/v1/chat/completions',
            models: [{ id: 'shared' }]
          },
          { id: 'b', endpoint: 'https://b.example/v1/chat/completions', models: [{ id: 'shared' }] }
        ]
      })
    ).toThrow(/模型 id "shared" 重复/)
  })

  it('挂载 models 与 defaultModel', () => {
    const transport = createOpenAITransport({
      providers: [
        {
          id: 'openai',
          label: 'OpenAI',
          endpoint: 'https://api.openai.com/v1/chat/completions',
          apiKey: 'sk-test',
          models: [
            { id: 'gpt-4o', label: 'GPT-4o' },
            { id: 'o3-mini', label: 'o3-mini' }
          ]
        }
      ]
    })

    expect(transport.defaultModel).toBe('gpt-4o')
    expect(transport.models).toEqual([
      { id: 'gpt-4o', label: 'GPT-4o', providerId: 'openai', providerLabel: 'OpenAI' },
      { id: 'o3-mini', label: 'o3-mini', providerId: 'openai', providerLabel: 'OpenAI' }
    ])
  })

  it('按 model 路由到不同 endpoint，相对路径原样 fetch', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' }
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const transport = createOpenAITransport({
      providers: [
        { id: 'proxy', endpoint: '/api/ai/chat/completions', models: [{ id: 'proxy-model' }] },
        {
          id: 'remote',
          endpoint: 'https://api.example.com/v1/chat/completions',
          apiKey: 'sk-remote',
          models: [{ id: 'remote-model' }]
        }
      ]
    })

    const handlers = baseHandlers()
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        model: 'remote-model',
        signal: new AbortController().signal
      },
      handlers
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]![0]).toBe('https://api.example.com/v1/chat/completions')
    const remoteInit = fetchMock.mock.calls[0]![1] as RequestInit
    expect(remoteInit.headers).toMatchObject({ Authorization: 'Bearer sk-remote' })
    expect(JSON.parse(String(remoteInit.body))).toMatchObject({
      model: 'remote-model',
      stream: true
    })

    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        model: 'proxy-model',
        signal: new AbortController().signal
      },
      handlers
    )

    expect(fetchMock.mock.calls[1]![0]).toBe('/api/ai/chat/completions')
    const proxyInit = fetchMock.mock.calls[1]![1] as RequestInit
    expect((proxyInit.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('无 apiKey 时不带 Authorization', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('data: [DONE]\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' }
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const transport = createOpenAITransport({
      providers: [
        { id: 'local', endpoint: '/api/chat/completions', models: [{ id: 'local-model' }] }
      ]
    })

    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        signal: new AbortController().signal
      },
      baseHandlers()
    )

    const headers = fetchMock.mock.calls[0]![1]!.headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]!.body))).toMatchObject({
      model: 'local-model'
    })
  })

  it('缺省将 reasoningLevel 写入 reasoning_effort', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('data: [DONE]\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' }
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const transport = createOpenAITransport({
      providers: [
        {
          id: 'openai',
          endpoint: 'https://api.openai.com/v1/chat/completions',
          apiKey: 'sk',
          models: [{ id: 'o3-mini' }]
        }
      ]
    })

    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        model: 'o3-mini',
        reasoningLevel: 'high',
        signal: new AbortController().signal
      },
      baseHandlers()
    )

    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]!.body))).toMatchObject({
      model: 'o3-mini',
      reasoning_effort: 'high'
    })
  })

  it('applyReasoning 可自定义写入字段', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('data: [DONE]\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' }
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const transport = createOpenAITransport({
      providers: [
        {
          id: 'custom',
          endpoint: 'https://custom.example/v1/chat/completions',
          applyReasoning: (level, body) => {
            body.thinking = { budget: level }
          },
          models: [{ id: 'custom-model' }]
        }
      ]
    })

    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        reasoningLevel: '8k',
        signal: new AbortController().signal
      },
      baseHandlers()
    )

    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]!.body))).toMatchObject({
      thinking: { budget: '8k' }
    })
    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]!.body)).reasoning_effort).toBeUndefined()
  })

  it('未知 model 时通过 onError 报错且不发请求', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const handlers = baseHandlers()

    const transport = createOpenAITransport({
      providers: [
        { id: 'a', endpoint: 'https://a.example/v1/chat/completions', models: [{ id: 'known' }] }
      ]
    })

    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        model: 'unknown',
        signal: new AbortController().signal
      },
      handlers
    )

    expect(fetchMock).not.toHaveBeenCalled()
    expect(handlers.onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('unknown') })
    )
  })

  it('工具调用参数分片跨 chunk 累积为一次完整 onToolCall', async () => {
    // 同一工具调用的多个分片共享 index:0，不得被误判为"新一轮"而提前 flush
    const sse = String.raw`data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"calculate","arguments":""}}]}}]}

data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\"ex"}}]}}]}

data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"pression\":\"1+1\"}"}}]}}]}

data: [DONE]
`
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(sse, { status: 200 }))
    )

    const transport = createOpenAITransport({
      providers: [
        { id: 'a', endpoint: 'https://a.example/v1/chat/completions', models: [{ id: 'm' }] }
      ]
    })
    const handlers = baseHandlers()

    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        signal: new AbortController().signal
      },
      handlers
    )

    expect(handlers.onToolCall).toHaveBeenCalledTimes(1)
    expect(handlers.onToolCall).toHaveBeenCalledWith({
      id: 'call_1',
      name: 'calculate',
      arguments: '{"expression":"1+1"}'
    })
  })

  it('多个工具调用按 index 顺序完整抛出', async () => {
    const sse = String.raw`data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"alpha","arguments":""}}]}}]}

data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\"x\":1}"}}]}}]}

data: {"choices":[{"delta":{"tool_calls":[{"index":1,"id":"call_2","function":{"name":"beta","arguments":""}}]}}]}

data: {"choices":[{"delta":{"tool_calls":[{"index":1,"function":{"arguments":"{\"y\":2}"}}]}}]}

data: [DONE]
`
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(sse, { status: 200 }))
    )

    const transport = createOpenAITransport({
      providers: [
        { id: 'a', endpoint: 'https://a.example/v1/chat/completions', models: [{ id: 'm' }] }
      ]
    })
    const handlers = baseHandlers()

    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        signal: new AbortController().signal
      },
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

  it('请求体带 stream_options.include_usage', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response('data: [DONE]\n\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' }
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const transport = createOpenAITransport({
      providers: [
        { id: 'a', endpoint: 'https://a.example/v1/chat/completions', models: [{ id: 'm' }] }
      ]
    })
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        signal: new AbortController().signal
      },
      baseHandlers()
    )

    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]!.body))).toMatchObject({
      stream: true,
      stream_options: { include_usage: true }
    })
  })

  it('解析末包 usage，含缓存命中 / 未命中，无 usage 不回调', async () => {
    const sse = String.raw`data: {"choices":[{"delta":{"content":"hi"}}]}

data: {"choices":[],"usage":{"prompt_tokens":12,"completion_tokens":3,"total_tokens":15,"prompt_tokens_details":{"cached_tokens":8},"prompt_cache_hit_tokens":8,"prompt_cache_miss_tokens":4}}

data: [DONE]
`
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(sse, { status: 200 }))
    )

    const transport = createOpenAITransport({
      providers: [
        { id: 'a', endpoint: 'https://a.example/v1/chat/completions', models: [{ id: 'm' }] }
      ]
    })
    const handlers = baseHandlers()
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        signal: new AbortController().signal
      },
      handlers
    )

    expect(handlers.onTextDelta).toHaveBeenCalledWith('hi')
    expect(handlers.onUsage).toHaveBeenCalledTimes(1)
    expect(handlers.onUsage).toHaveBeenCalledWith({
      promptTokens: 12,
      completionTokens: 3,
      totalTokens: 15,
      cacheHitTokens: 8,
      cacheMissTokens: 4
    })
  })

  it('仅有 cached_tokens 时由 prompt − 命中得到未命中；缺 usage 不编造', async () => {
    const withCache = String.raw`data: {"choices":[{"delta":{"content":"a"}}],"usage":{"prompt_tokens":10,"completion_tokens":1,"total_tokens":11,"prompt_tokens_details":{"cached_tokens":7}}}

data: [DONE]
`
    const noUsage = String.raw`data: {"choices":[{"delta":{"content":"b"}}]}

data: [DONE]
`
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(withCache, { status: 200 }))
      .mockResolvedValueOnce(new Response(noUsage, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const transport = createOpenAITransport({
      providers: [
        { id: 'a', endpoint: 'https://a.example/v1/chat/completions', models: [{ id: 'm' }] }
      ]
    })

    const withCacheHandlers = baseHandlers()
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        signal: new AbortController().signal
      },
      withCacheHandlers
    )
    expect(withCacheHandlers.onUsage).toHaveBeenCalledWith({
      promptTokens: 10,
      completionTokens: 1,
      totalTokens: 11,
      cacheHitTokens: 7,
      cacheMissTokens: 3
    })

    const noUsageHandlers = baseHandlers()
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        signal: new AbortController().signal
      },
      noUsageHandlers
    )
    expect(noUsageHandlers.onUsage).not.toHaveBeenCalled()
  })

  it('解析 Anthropic 风格 cache_read / cache_creation', async () => {
    const sse = String.raw`data: {"choices":[{"delta":{"content":"ok"}}],"usage":{"prompt_tokens":20,"completion_tokens":2,"total_tokens":22,"cache_read_input_tokens":15,"cache_creation_input_tokens":3}}

data: [DONE]
`
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(sse, { status: 200 }))
    )

    const transport = createOpenAITransport({
      providers: [
        { id: 'a', endpoint: 'https://a.example/v1/chat/completions', models: [{ id: 'm' }] }
      ]
    })
    const handlers = baseHandlers()
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        signal: new AbortController().signal
      },
      handlers
    )

    expect(handlers.onUsage).toHaveBeenCalledWith({
      promptTokens: 20,
      completionTokens: 2,
      totalTokens: 22,
      cacheHitTokens: 15,
      cacheMissTokens: 5,
      cacheCreationTokens: 3
    })
  })
})

describe('createOpenAITransport · responses 模式', () => {
  it('auto 裸 base URL：优先请求 <base>/responses，请求体为 Responses 格式并解析事件流', async () => {
    const sse =
      'event: response.output_text.delta\n' +
      'data: {"type":"response.output_text.delta","delta":"你好"}\n\n' +
      'event: response.completed\n' +
      'data: {"type":"response.completed","response":{"usage":{"input_tokens":10,"output_tokens":5,"total_tokens":15}}}\n\n'
    const fetchMock = vi.fn(async () => new Response(sse, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const transport = createOpenAITransport({
      providers: [
        {
          id: 'openai',
          endpoint: 'https://api.openai.com/v1',
          apiKey: 'sk-test',
          models: [{ id: 'gpt-5' }]
        }
      ]
    })
    const handlers = baseHandlers()
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        systemPrompt: 'sys',
        reasoningLevel: 'high',
        signal: new AbortController().signal
      },
      handlers
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]![0]).toBe('https://api.openai.com/v1/responses')
    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]!.body))).toMatchObject({
      model: 'gpt-5',
      stream: true,
      instructions: 'sys',
      reasoning: { effort: 'high' },
      input: [{ role: 'user', content: 'hi' }]
    })
    expect(handlers.onTextDelta).toHaveBeenCalledWith('你好')
    expect(handlers.onUsage).toHaveBeenCalledWith({
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15
    })
    expect(handlers.onError).not.toHaveBeenCalled()
  })

  it('auto base URL 以斜杠结尾时归一化拼 /responses；mode responses 原样使用 endpoint', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const transport = createOpenAITransport({
      providers: [
        { id: 'a', endpoint: 'https://a.example/v1/', models: [{ id: 'm1' }] },
        { id: 'b', mode: 'responses', endpoint: '/api/custom-responses', models: [{ id: 'm2' }] }
      ]
    })
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        model: 'm1',
        signal: new AbortController().signal
      },
      baseHandlers()
    )
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        model: 'm2',
        signal: new AbortController().signal
      },
      baseHandlers()
    )

    expect(fetchMock.mock.calls[0]![0]).toBe('https://a.example/v1/responses')
    expect(fetchMock.mock.calls[1]![0]).toBe('/api/custom-responses')
  })

  it('endpoint 以 /responses 结尾时 auto 直接用 responses（不去改写地址）', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const transport = createOpenAITransport({
      providers: [{ id: 'a', endpoint: '/api/ai/responses', models: [{ id: 'm' }] }]
    })
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        signal: new AbortController().signal
      },
      baseHandlers()
    )

    expect(fetchMock.mock.calls[0]![0]).toBe('/api/ai/responses')
    const body = JSON.parse(String(fetchMock.mock.calls[0]![1]!.body))
    expect(body.input).toEqual([{ role: 'user', content: 'hi' }])
    expect(body.messages).toBeUndefined()
  })

  it('responses 收到 404 / 405 时自动回退 <base>/chat/completions 并改用 chat 请求体', async () => {
    const chatSse = 'data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('not found', { status: 404 }))
      .mockResolvedValueOnce(new Response(chatSse, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const transport = createOpenAITransport({
      providers: [{ id: 'proxy', endpoint: '/api/ai', models: [{ id: 'm' }] }]
    })
    const handlers = baseHandlers()
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        signal: new AbortController().signal
      },
      handlers
    )

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/ai/responses')
    expect(fetchMock.mock.calls[1]![0]).toBe('/api/ai/chat/completions')
    const fallbackBody = JSON.parse(String(fetchMock.mock.calls[1]![1]!.body))
    expect(fallbackBody).toMatchObject({
      model: 'm',
      stream: true,
      messages: [{ role: 'user', content: 'hi' }],
      stream_options: { include_usage: true }
    })
    expect(fallbackBody.input).toBeUndefined()
    expect(handlers.onTextDelta).toHaveBeenCalledWith('ok')
    expect(handlers.onError).not.toHaveBeenCalled()

    // 405 同样回退（换新 transport：上一个已记忆直连地址）
    fetchMock
      .mockReset()
      .mockResolvedValueOnce(new Response('', { status: 405 }))
      .mockResolvedValueOnce(new Response('data: [DONE]\n\n', { status: 200 }))
    const transport405 = createOpenAITransport({
      providers: [{ id: 'proxy', endpoint: '/api/ai', models: [{ id: 'm' }] }]
    })
    await transport405(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        signal: new AbortController().signal
      },
      baseHandlers()
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/ai/responses')
    expect(fetchMock.mock.calls[1]![0]).toBe('/api/ai/chat/completions')
  })

  it('两级派生地址都 404 时回退 endpoint 原地址（chat 格式，兼容历史配置）', async () => {
    const chatSse = 'data: {"choices":[{"delta":{"content":"legacy"}}]}\n\ndata: [DONE]\n\n'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(new Response(chatSse, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const transport = createOpenAITransport({
      providers: [{ id: 'legacy', endpoint: '/api/ai/chat', models: [{ id: 'm' }] }]
    })
    const handlers = baseHandlers()
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        signal: new AbortController().signal
      },
      handlers
    )

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/ai/chat/responses')
    expect(fetchMock.mock.calls[1]![0]).toBe('/api/ai/chat/chat/completions')
    expect(fetchMock.mock.calls[2]![0]).toBe('/api/ai/chat')
    const body = JSON.parse(String(fetchMock.mock.calls[2]![1]!.body))
    expect(body.messages).toEqual([{ role: 'user', content: 'hi' }])
    expect(handlers.onTextDelta).toHaveBeenCalledWith('legacy')
    expect(handlers.onError).not.toHaveBeenCalled()
  })

  it('探测命中后记忆直连地址：第二次发送不再逐级探测', async () => {
    const chatSse = 'data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 404 }))
      .mockResolvedValueOnce(new Response(chatSse, { status: 200 }))
      .mockResolvedValueOnce(new Response(chatSse, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const transport = createOpenAITransport({
      providers: [{ id: 'proxy', endpoint: '/api/ai', models: [{ id: 'm' }] }]
    })
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        signal: new AbortController().signal
      },
      baseHandlers()
    )
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        signal: new AbortController().signal
      },
      baseHandlers()
    )

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[2]![0]).toBe('/api/ai/chat/completions')
  })

  it('responses 流的 function_call 解析为完整 onToolCall，response.failed 经 onError 报错', async () => {
    const sse =
      'data: {"type":"response.output_item.added","item":{"id":"fc_1","type":"function_call","call_id":"call_1","name":"get_weather","arguments":""}}\n\n' +
      'data: {"type":"response.function_call_arguments.delta","item_id":"fc_1","delta":"{\\"city\\":\\"北京\\"}"}\n\n' +
      'data: {"type":"response.output_item.done","item":{"id":"fc_1","type":"function_call","call_id":"call_1","name":"get_weather","arguments":"{\\"city\\":\\"北京\\"}"}}\n\n' +
      'data: {"type":"response.completed","response":{}}\n\n'
    const fetchMock = vi.fn(async () => new Response(sse, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const transport = createOpenAITransport({
      providers: [{ id: 'a', mode: 'responses', endpoint: '/api/responses', models: [{ id: 'm' }] }]
    })
    const handlers = baseHandlers()
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        tools: [
          {
            name: 'get_weather',
            description: '查天气',
            parameters: { type: 'object' },
            execute: () => ({})
          }
        ],
        signal: new AbortController().signal
      },
      handlers
    )

    // 工具为 Responses 扁平结构
    const body = JSON.parse(String(fetchMock.mock.calls[0]![1]!.body))
    expect(body.tools).toEqual([
      {
        type: 'function',
        name: 'get_weather',
        description: '查天气',
        parameters: { type: 'object' }
      }
    ])
    expect(handlers.onToolCall).toHaveBeenCalledTimes(1)
    expect(handlers.onToolCall).toHaveBeenCalledWith({
      id: 'call_1',
      name: 'get_weather',
      arguments: '{"city":"北京"}'
    })

    fetchMock
      .mockReset()
      .mockResolvedValue(
        new Response(
          'data: {"type":"response.failed","response":{"error":{"code":"server_error","message":"内部错误"}}}\n\n',
          { status: 200 }
        )
      )
    const failHandlers = baseHandlers()
    await transport(
      {
        messages: [{ id: '1', role: 'user', content: 'hi' }],
        signal: new AbortController().signal
      },
      failHandlers
    )
    expect(failHandlers.onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('内部错误') })
    )
  })
})
