import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import { buildOpenAIBody } from '../openai'
import { requestAiText, requestOpenAIStream } from '../request'
import type { AiProviderConfig } from '../types'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function config(overrides: Partial<AiProviderConfig> = {}): AiProviderConfig {
  return {
    url: 'https://api.example.com/v1/chat/completions',
    apiKey: 'sk-test',
    model: 'gpt-x',
    ...overrides
  }
}

function sseResponse(sse: string): Response {
  return new Response(sse, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}

describe('requestAiText', () => {
  it('流式：增量逐段触发 onDelta，结束后以拼接文本触发 onSuccess，请求体带 system/user 消息与 reasoning_effort', async () => {
    const sse =
      'data: {"choices":[{"delta":{"content":"He"}}]}\n\n' +
      'data: {"choices":[{"delta":{"content":"llo"}}]}\n\n' +
      'data: [DONE]\n\n'
    const fetchMock = vi.fn(async () => sseResponse(sse))
    vi.stubGlobal('fetch', fetchMock)

    const onDelta = vi.fn()
    const onSuccess = vi.fn()
    const onError = vi.fn()
    await requestAiText({
      config: config({ stream: true, reasoningLevel: 'high' }),
      prompt: 'hi',
      systemPrompt: 'sys',
      onDelta,
      onSuccess,
      onError
    })

    expect(onDelta).toHaveBeenNthCalledWith(1, 'He')
    expect(onDelta).toHaveBeenNthCalledWith(2, 'llo')
    expect(onSuccess).toHaveBeenCalledWith('Hello')
    expect(onError).not.toHaveBeenCalled()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.example.com/v1/chat/completions')
    expect(init!.method).toBe('POST')
    expect(init!.headers).toMatchObject({
      'Content-Type': 'application/json',
      Authorization: 'Bearer sk-test'
    })
    expect(JSON.parse(String(init!.body))).toMatchObject({
      model: 'gpt-x',
      stream: true,
      stream_options: { include_usage: true },
      reasoning_effort: 'high',
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'hi' }
      ]
    })
  })

  it('非流式（缺省 stream=false）：解析 JSON 响应为完整文本，不触发 onDelta', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ choices: [{ message: { role: 'assistant', content: '完整答案' } }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    )
    vi.stubGlobal('fetch', fetchMock)

    const onDelta = vi.fn()
    const onSuccess = vi.fn()
    const onError = vi.fn()
    await requestAiText({ config: config(), prompt: 'q', onDelta, onSuccess, onError })

    expect(onDelta).not.toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalledWith('完整答案')
    expect(onError).not.toHaveBeenCalled()

    const body = JSON.parse(String(fetchMock.mock.calls[0]![1]!.body))
    expect(body).toMatchObject({
      model: 'gpt-x',
      stream: false,
      messages: [{ role: 'user', content: 'q' }]
    })
    expect(body.stream_options).toBeUndefined()
  })

  it('非流式响应缺可解析文本或非法 JSON 时触发 onError', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ choices: [{ message: {} }] }), { status: 200 })
        )
        .mockResolvedValueOnce(new Response('not json', { status: 200 }))
    )

    const onError = vi.fn()
    await requestAiText({ config: config(), prompt: 'q', onError })
    expect(onError).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ message: expect.stringContaining('文本内容') })
    )

    await requestAiText({ config: config(), prompt: 'q', onError })
    expect(onError).toHaveBeenNthCalledWith(2, expect.any(Error))
  })

  it('非 2xx 触发 onError（含状态码与响应体），不触发 onSuccess', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('rate limited', { status: 429 }))
    )

    const onSuccess = vi.fn()
    const onError = vi.fn()
    await requestAiText({ config: config(), prompt: 'q', onSuccess, onError })

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/429.*rate limited/) })
    )
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('网络错误触发 onError；signal 中断时静默（不触发任何回调）', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed')
      })
    )

    const onError = vi.fn()
    await requestAiText({ config: config({ stream: true }), prompt: 'hi', onError })
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(new TypeError('fetch failed'))

    const controller = new AbortController()
    controller.abort()
    const silent = { onError: vi.fn(), onSuccess: vi.fn(), onDelta: vi.fn() }
    await requestAiText({
      config: config({ stream: true }),
      prompt: 'hi',
      signal: controller.signal,
      ...silent
    })
    expect(silent.onError).not.toHaveBeenCalled()
    expect(silent.onSuccess).not.toHaveBeenCalled()
    expect(silent.onDelta).not.toHaveBeenCalled()
  })

  it('无 apiKey 不带 Authorization 头', async () => {
    const fetchMock = vi.fn(async () => sseResponse('data: [DONE]\n\n'))
    vi.stubGlobal('fetch', fetchMock)

    await requestAiText({ config: config({ apiKey: undefined }), prompt: 'hi' })

    const headers = fetchMock.mock.calls[0]![1]!.headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
    expect(headers['Content-Type']).toBe('application/json')
  })
})

describe('requestOpenAIStream', () => {
  function streamBody(): Record<string, unknown> {
    return buildOpenAIBody({
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      stream: true
    })
  }

  it('流完整读取返回 true，额外请求头合并、无 apiKey 不带 Authorization', async () => {
    const fetchMock = vi.fn(async () =>
      sseResponse('data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n')
    )
    vi.stubGlobal('fetch', fetchMock)

    const handlers = { onTextDelta: vi.fn(), onError: vi.fn() }
    const completed = await requestOpenAIStream(
      { url: '/api/chat', body: streamBody(), headers: { 'X-Trace': '1' } },
      handlers
    )

    expect(completed).toBe(true)
    expect(handlers.onTextDelta).toHaveBeenCalledWith('ok')
    expect(handlers.onError).not.toHaveBeenCalled()

    const headers = fetchMock.mock.calls[0]![1]!.headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
    expect(headers['X-Trace']).toBe('1')
  })

  it('响应无 body 时经 onError 报错并返回 false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, body: null }) as unknown as Response)
    )

    const handlers = { onTextDelta: vi.fn(), onError: vi.fn() }
    const completed = await requestOpenAIStream({ url: '/api/chat', body: streamBody() }, handlers)

    expect(completed).toBe(false)
    expect(handlers.onError).toHaveBeenCalledWith(new Error('响应不包含可读取的流'))
  })
})
