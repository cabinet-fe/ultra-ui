import type { ChatModelOption, ChatProvider } from '../../providers'
import type {
  ChatMessage,
  ChatTokenUsage,
  ChatTool,
  ChatTransport,
  ChatTransportHandlers,
  ChatTransportRequest
} from '../types'

/** createOpenAITransport 的配置项（多 Provider） */
export interface OpenAITransportOptions {
  /** 至少一个 Provider；模型 id 须跨 Provider 全局唯一 */
  providers: ChatProvider[]
  /** 全局额外请求头（与各 Provider headers 合并，Provider 优先） */
  headers?: Record<string, string>
  /** 全局额外请求体字段，如 temperature、top_p */
  body?: Record<string, unknown>
}

/** 带扁平模型列表元数据的 OpenAI 兼容 transport */
export type OpenAITransport = ChatTransport & {
  /** 供 UI 使用的扁平模型列表 */
  readonly models: ChatModelOption[]
  /** 默认模型 id（首个 Provider 的首个模型） */
  readonly defaultModel: string
}

interface OpenAIMessage {
  role: string
  content?: unknown
  tool_calls?: unknown[]
  tool_call_id?: string
}

function toOpenAIMessages(messages: ChatMessage[], systemPrompt?: string): OpenAIMessage[] {
  const result: OpenAIMessage[] = []

  if (systemPrompt) {
    result.push({ role: 'system', content: systemPrompt })
  }

  for (const msg of messages) {
    if (msg.role === 'user') {
      if (msg.attachments?.length) {
        const parts: unknown[] = []
        if (msg.content) parts.push({ type: 'text', text: msg.content })
        for (const att of msg.attachments) {
          parts.push({ type: 'image_url', image_url: { url: att.dataUrl } })
        }
        result.push({ role: 'user', content: parts })
      } else {
        result.push({ role: 'user', content: msg.content })
      }
    } else if (msg.role === 'assistant') {
      const item: OpenAIMessage = { role: 'assistant', content: msg.content || '' }
      if (msg.toolCalls?.length) {
        item.tool_calls = msg.toolCalls.map((call) => ({
          id: call.id,
          type: 'function',
          function: { name: call.name, arguments: call.arguments }
        }))
      }
      result.push(item)
    } else if (msg.role === 'tool') {
      result.push({ role: 'tool', tool_call_id: msg.toolCallId, content: msg.content })
    }
  }

  return result
}

function toOpenAITools(tools: ChatTool[]): unknown[] {
  return tools.map((tool) => ({
    type: 'function',
    function: { name: tool.name, description: tool.description, parameters: tool.parameters }
  }))
}

interface AccumulatedToolCall {
  id: string
  name: string
  arguments: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 非负有限整数；非法或缺省返回 undefined（不把缺失当成 0） */
function readCount(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return undefined
  return Math.floor(value)
}

/**
 * 从 OpenAI 兼容 usage 对象解析。
 * 缓存字段只在源数据出现时写入；未命中可在「有命中 + prompt」时由差值得出。
 */
function parseOpenAIUsage(raw: unknown): ChatTokenUsage | null {
  if (!isRecord(raw)) return null

  const promptTokens = readCount(raw.prompt_tokens) ?? readCount(raw.input_tokens)
  const completionTokens = readCount(raw.completion_tokens) ?? readCount(raw.output_tokens)
  if (promptTokens == null && completionTokens == null) return null

  const prompt = promptTokens ?? 0
  const completion = completionTokens ?? 0
  const usage: ChatTokenUsage = {
    promptTokens: prompt,
    completionTokens: completion,
    totalTokens: readCount(raw.total_tokens) ?? prompt + completion
  }

  const details = isRecord(raw.prompt_tokens_details) ? raw.prompt_tokens_details : undefined
  const inputDetails = isRecord(raw.input_tokens_details) ? raw.input_tokens_details : undefined
  const cacheHitTokens =
    readCount(details?.cached_tokens) ??
    readCount(inputDetails?.cached_tokens) ??
    readCount(raw.prompt_cache_hit_tokens) ??
    readCount(raw.cache_read_input_tokens) ??
    readCount(raw.cached_tokens)
  if (cacheHitTokens != null) usage.cacheHitTokens = cacheHitTokens

  const cacheMissTokens =
    readCount(raw.prompt_cache_miss_tokens) ??
    (cacheHitTokens != null && promptTokens != null
      ? Math.max(0, promptTokens - cacheHitTokens)
      : undefined)
  if (cacheMissTokens != null) usage.cacheMissTokens = cacheMissTokens

  const cacheCreationTokens = readCount(raw.cache_creation_input_tokens)
  if (cacheCreationTokens != null) usage.cacheCreationTokens = cacheCreationTokens

  return usage
}

/**
 * 逐行解析 SSE 流。
 * 兼容 OpenAI 及 DeepSeek 等 reasoning_content 风格的兼容端点。
 */
async function parseSSE(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  handlers: ChatTransportHandlers
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  // 按 OpenAI 流式协议中 tool_calls 的 index 累积参数片段
  const accumulated = new Map<number, AccumulatedToolCall>()
  let lastIndex = -1

  const flushToolCalls = () => {
    if (!handlers.onToolCall) return
    for (const call of accumulated.values()) {
      if (call.id && call.name) {
        handlers.onToolCall({ id: call.id, name: call.name, arguments: call.arguments })
      }
    }
    accumulated.clear()
  }

  const handleData = (data: string) => {
    if (data === '[DONE]') return

    let chunk: unknown
    try {
      chunk = JSON.parse(data)
    } catch {
      return
    }
    if (!isRecord(chunk)) return

    const usage = parseOpenAIUsage(chunk.usage)
    if (usage) handlers.onUsage?.(usage)

    const choices = chunk.choices
    const first = Array.isArray(choices) ? choices[0] : undefined
    const delta = isRecord(first) ? first.delta : undefined
    if (!isRecord(delta)) return

    if (typeof delta.content === 'string' && delta.content) {
      handlers.onTextDelta(delta.content)
    }

    // 兼容 reasoning_content（DeepSeek）与 reasoning（部分 OpenAI 兼容端点）
    const reasoning = delta.reasoning_content ?? delta.reasoning
    if (typeof reasoning === 'string' && reasoning) {
      handlers.onReasoningDelta?.(reasoning)
    }

    if (Array.isArray(delta.tool_calls)) {
      for (const tc of delta.tool_calls) {
        if (!isRecord(tc)) continue
        const index = typeof tc.index === 'number' ? tc.index : 0
        // 同一调用的参数分片共享 index；index 变大才说明前一个调用已完整，先抛出去
        if (index > lastIndex && accumulated.size > 0) flushToolCalls()
        lastIndex = Math.max(lastIndex, index)

        let call = accumulated.get(index)
        if (!call) {
          call = { id: '', name: '', arguments: '' }
          accumulated.set(index, call)
        }
        if (typeof tc.id === 'string') call.id = tc.id
        const fn = isRecord(tc.function) ? tc.function : undefined
        if (typeof fn?.name === 'string') call.name += fn.name
        if (typeof fn?.arguments === 'string') call.arguments += fn.arguments
      }
    }
  }

  try {
    // 递归泵取代替 while 循环，避免 await-in-loop
    const pump = async (): Promise<void> => {
      const { done, value } = await reader.read()
      if (done || signal.aborted) return

      buffer += decoder.decode(value, { stream: true })

      let newlineIndex: number
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)
        if (line.startsWith('data:')) {
          handleData(line.slice(5).trim())
        }
      }

      return pump()
    }

    await pump()

    if (buffer.trim().startsWith('data:')) {
      handleData(buffer.trim().slice(5).trim())
    }
  } finally {
    reader.releaseLock()
  }

  flushToolCalls()
}

/** 校验 providers 并展开扁平模型列表 */
function flattenModels(providers: ChatProvider[]): {
  models: ChatModelOption[]
  byModelId: Map<string, ChatProvider>
} {
  if (!providers.length) {
    throw new Error('[createOpenAITransport] providers 不能为空')
  }

  const models: ChatModelOption[] = []
  const byModelId = new Map<string, ChatProvider>()

  for (const provider of providers) {
    if (!provider.models?.length) {
      throw new Error(`[createOpenAITransport] Provider "${provider.id}" 未配置 models`)
    }
    for (const model of provider.models) {
      if (byModelId.has(model.id)) {
        throw new Error(
          `[createOpenAITransport] 模型 id "${model.id}" 重复（跨 Provider 须全局唯一）`
        )
      }
      byModelId.set(model.id, provider)
      models.push({ ...model, providerId: provider.id, providerLabel: provider.label })
    }
  }

  return { models, byModelId }
}

/** 缺省：写入 OpenAI 兼容的 reasoning_effort */
function defaultApplyReasoning(level: string, body: Record<string, unknown>) {
  body.reasoning_effort = level
}

/**
 * 创建 OpenAI 兼容协议的传输层（chat/completions SSE）。
 * 按 request.model 路由到对应 Provider 的 endpoint；手写 fetch + SSE，无第三方依赖。
 */
export function createOpenAITransport(options: OpenAITransportOptions): OpenAITransport {
  const { providers, headers: globalHeaders, body: globalBody } = options
  const { models, byModelId } = flattenModels(providers)
  const defaultModel = models[0]!.id

  const send: ChatTransport = async (
    request: ChatTransportRequest,
    handlers: ChatTransportHandlers
  ) => {
    const { messages, systemPrompt, tools, signal, reasoningLevel } = request
    const modelId = request.model ?? defaultModel
    const provider = byModelId.get(modelId)

    if (!provider) {
      handlers.onError?.(new Error(`未找到模型 "${modelId}" 对应的 Provider`))
      return
    }

    const extraStreamOptions = isRecord(globalBody?.stream_options)
      ? globalBody.stream_options
      : undefined
    const requestBody: Record<string, unknown> = {
      ...globalBody,
      model: modelId,
      stream: true,
      // 流式默认要末包 usage；OpenAI / DeepSeek 等兼容端点靠这个字段才会返回
      stream_options: { ...extraStreamOptions, include_usage: true },
      messages: toOpenAIMessages(messages, systemPrompt),
      ...(tools?.length ? { tools: toOpenAITools(tools) } : {})
    }

    if (reasoningLevel) {
      const apply = provider.applyReasoning ?? defaultApplyReasoning
      apply(reasoningLevel, requestBody)
    }

    let response: Response
    try {
      response = await fetch(provider.endpoint, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          ...(provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}),
          ...globalHeaders,
          ...provider.headers
        },
        body: JSON.stringify(requestBody)
      })
    } catch (error) {
      if (!signal.aborted) {
        handlers.onError?.(error instanceof Error ? error : new Error(String(error)))
      }
      return
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      handlers.onError?.(
        new Error(`请求失败（${response.status}）：${text || response.statusText}`)
      )
      return
    }

    if (!response.body) {
      handlers.onError?.(new Error('响应不包含可读取的流'))
      return
    }

    try {
      await parseSSE(response.body, signal, handlers)
    } catch (error) {
      if (!signal.aborted) {
        handlers.onError?.(error instanceof Error ? error : new Error(String(error)))
      }
    }
  }

  return Object.assign(send, { models, defaultModel })
}
