import {
  formatFileAttachmentText,
  isImageAttachment,
  isRecord,
  parseOpenAIUsage,
  pumpSSEData
} from './shared'
import type { AiAttachment, AiMessage, AiStreamHandlers, AiTool } from './types'

export interface OpenAIBodyOptions {
  model: string
  /** 消息历史（内部消息模型，本函数转换为 wire 格式） */
  messages: readonly AiMessage[]
  /** 系统提示词，存在时作为首条 system 消息 */
  systemPrompt?: string
  tools?: readonly AiTool[]
  stream?: boolean
  /** 推理等级（不透明字符串，由 applyReasoning 写入请求体） */
  reasoningLevel?: string
  /** 自定义推理等级写入（缺省写 OpenAI 兼容的 reasoning_effort） */
  applyReasoning?(level: string, body: Record<string, unknown>): void
  /** 额外请求体字段（展开在最前，同名字段以本函数写入的为准） */
  extraBody?: Record<string, unknown>
}

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

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]!
    if (msg.role === 'user') {
      if (msg.attachments?.length) {
        const imageAttachments: AiAttachment[] = []
        const textBlocks: string[] = []
        for (const att of msg.attachments) {
          if (isImageAttachment(att)) {
            imageAttachments.push(att)
          } else {
            textBlocks.push(formatFileAttachmentText(att))
          }
        }
        if (msg.content) textBlocks.push(msg.content)
        const combinedText = textBlocks.join('\n\n')

        if (imageAttachments.length) {
          const parts: unknown[] = []
          if (combinedText) parts.push({ type: 'text', text: combinedText })
          for (const att of imageAttachments) {
            parts.push({ type: 'image_url', image_url: { url: att.dataUrl } })
          }
          result.push({ role: 'user', content: parts })
        } else {
          result.push({ role: 'user', content: combinedText })
        }
      } else {
        result.push({ role: 'user', content: msg.content })
      }
    } else if (msg.role === 'assistant') {
      const toolCalls = msg.toolCalls
      // 跳过无内容且无工具调用的空 assistant 占位（如中止或失败轮次遗留），避免干扰后续对话
      if (!msg.content && !toolCalls?.length) continue

      const item: OpenAIMessage = { role: 'assistant', content: msg.content || '' }
      if (toolCalls?.length) {
        item.tool_calls = toolCalls.map((call) => ({
          id: call.id,
          type: 'function',
          function: { name: call.name, arguments: call.arguments }
        }))
      }
      result.push(item)

      if (toolCalls?.length) {
        const answered = new Set<string>()
        while (i + 1 < messages.length && messages[i + 1]!.role === 'tool') {
          i++
          const toolMsg = messages[i]!
          if (toolMsg.toolCallId) answered.add(toolMsg.toolCallId)
          result.push({ role: 'tool', tool_call_id: toolMsg.toolCallId, content: toolMsg.content })
        }
        // 为缺少对应 tool 响应的 call_id 补齐兜底结果，避免 OpenAI/DeepSeek 报 400
        for (const call of toolCalls) {
          if (!answered.has(call.id)) {
            result.push({ role: 'tool', tool_call_id: call.id, content: 'Error: Aborted' })
          }
        }
      }
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

function defaultApplyReasoning(level: string, body: Record<string, unknown>) {
  body.reasoning_effort = level
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

  await pumpSSEData(body, signal, handleData)

  if (!signal?.aborted) flushToolCalls()
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
