import type { AiMessage, AiStreamHandlers, AiTokenUsage, AiTool } from './types'

/** 请求体构造选项 */
export interface OpenAIBodyOptions {
  /** 模型 id */
  model: string
  /** 消息历史（内部消息模型，本函数转换为 wire 格式） */
  messages: readonly AiMessage[]
  /** 系统提示词，存在时作为首条 system 消息 */
  systemPrompt?: string
  /** 可用工具 */
  tools?: readonly AiTool[]
  /** 是否流式，缺省 false */
  stream?: boolean
  /** 推理等级（不透明字符串，由 applyReasoning 写入请求体） */
  reasoningLevel?: string
  /** 自定义推理等级写入（缺省写 OpenAI 兼容的 reasoning_effort） */
  applyReasoning?(level: string, body: Record<string, unknown>): void
  /** 额外请求体字段（展开在最前，同名字段以本函数写入的为准） */
  extraBody?: Record<string, unknown>
}

/** OpenAI 兼容 wire 消息格式 */
interface OpenAIMessage {
  role: string
  content?: unknown
  tool_calls?: unknown[]
  tool_call_id?: string
}

function toOpenAIMessages(messages: readonly AiMessage[], systemPrompt?: string): OpenAIMessage[] {
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

function toOpenAITools(tools: readonly AiTool[]): unknown[] {
  return tools.map((tool) => ({
    type: 'function',
    function: { name: tool.name, description: tool.description, parameters: tool.parameters }
  }))
}

/** 缺省：写入 OpenAI 兼容的 reasoning_effort */
function defaultApplyReasoning(level: string, body: Record<string, unknown>) {
  body.reasoning_effort = level
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
function parseOpenAIUsage(raw: unknown): AiTokenUsage | null {
  if (!isRecord(raw)) return null

  const promptTokens = readCount(raw.prompt_tokens) ?? readCount(raw.input_tokens)
  const completionTokens = readCount(raw.completion_tokens) ?? readCount(raw.output_tokens)
  if (promptTokens == null && completionTokens == null) return null

  const prompt = promptTokens ?? 0
  const completion = completionTokens ?? 0
  const usage: AiTokenUsage = {
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

interface AccumulatedToolCall {
  id: string
  name: string
  arguments: string
}

/**
 * 构造 OpenAI 兼容 chat/completions 请求体。
 * 流式时写入 `stream_options.include_usage` 以获取末包 usage。
 */
export function buildOpenAIBody(options: OpenAIBodyOptions): Record<string, unknown> {
  const { model, messages, systemPrompt, tools, reasoningLevel, applyReasoning, extraBody } =
    options
  const stream = options.stream ?? false
  // 额外字段里的 stream_options 与 include_usage 合并，额外字段优先的部分仍保留
  const extraStreamOptions = isRecord(extraBody?.stream_options)
    ? extraBody.stream_options
    : undefined

  const body: Record<string, unknown> = {
    ...extraBody,
    model,
    stream,
    // 流式默认要末包 usage；OpenAI / DeepSeek 等兼容端点靠这个字段才会返回
    ...(stream ? { stream_options: { ...extraStreamOptions, include_usage: true } } : {}),
    messages: toOpenAIMessages(messages, systemPrompt),
    ...(tools?.length ? { tools: toOpenAITools(tools) } : {})
  }

  if (reasoningLevel) {
    const apply = applyReasoning ?? defaultApplyReasoning
    apply(reasoningLevel, body)
  }

  return body
}

/**
 * 逐行解析 OpenAI 兼容 SSE 流（`data:` 帧、`[DONE]`、content / reasoning 增量、
 * tool_calls 分片累积、usage 解析）。
 * 兼容 OpenAI 及 DeepSeek 等 reasoning_content 风格的兼容端点。
 * 读流抛出的异常原样向外传播，由调用方决定错误处理；signal 中断即停止读取。
 */
export async function parseOpenAISSEStream(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal | undefined,
  handlers: AiStreamHandlers
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
      if (done || signal?.aborted) return

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

/**
 * 从非流式 chat/completions JSON 响应取完整回复文本。
 * 响应形状不含可解析文本时返回 undefined。
 */
export function parseOpenAICompletionText(json: unknown): string | undefined {
  if (!isRecord(json)) return undefined
  const choices = json.choices
  const first = Array.isArray(choices) ? choices[0] : undefined
  const message = isRecord(first) && isRecord(first.message) ? first.message : undefined
  return typeof message?.content === 'string' ? message.content : undefined
}
