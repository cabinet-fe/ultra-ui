import {
  formatFileAttachmentText,
  isImageAttachment,
  isRecord,
  parseOpenAIUsage,
  pumpSSEData
} from './shared'
import type { AiAttachment, AiMessage, AiStreamHandlers, AiTool } from './types'

/** 请求体构造选项（字段语义同 chat/completions 的 OpenAIBodyOptions） */
export interface OpenAIResponsesBodyOptions {
  model: string
  /** 消息历史（内部消息模型，本函数转换为 wire 格式） */
  messages: readonly AiMessage[]
  /** 系统提示词，存在时写入 instructions */
  systemPrompt?: string
  tools?: readonly AiTool[]
  stream?: boolean
  /** 推理等级（不透明字符串，由 applyReasoning 写入请求体） */
  reasoningLevel?: string
  /** 自定义推理等级写入（缺省写 OpenAI Responses 的 reasoning.effort） */
  applyReasoning?(level: string, body: Record<string, unknown>): void
  /** 额外请求体字段（展开在最前，同名字段以本函数写入的为准） */
  extraBody?: Record<string, unknown>
}

/** Responses API 的 input 数组项 */
interface ResponsesInputItem {
  type?: string
  role?: string
  content?: unknown
  call_id?: string
  name?: string
  arguments?: string
  output?: string
}

function toResponsesInput(messages: readonly AiMessage[]): ResponsesInputItem[] {
  const result: ResponsesInputItem[] = []

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

        const parts: unknown[] = []
        if (combinedText) parts.push({ type: 'input_text', text: combinedText })
        for (const att of imageAttachments) {
          parts.push({ type: 'input_image', image_url: att.dataUrl })
        }
        result.push({ role: 'user', content: parts })
      } else {
        result.push({ role: 'user', content: msg.content })
      }
    } else if (msg.role === 'assistant') {
      const toolCalls = msg.toolCalls
      // 跳过无内容且无工具调用的空 assistant 占位（如中止或失败轮次遗留），避免干扰后续对话
      if (!msg.content && !toolCalls?.length) continue

      if (msg.content) {
        result.push({
          type: 'message',
          role: 'assistant',
          content: [{ type: 'output_text', text: msg.content }]
        })
      }
      if (toolCalls?.length) {
        for (const call of toolCalls) {
          result.push({
            type: 'function_call',
            call_id: call.id,
            name: call.name,
            arguments: call.arguments
          })
        }

        const answered = new Set<string>()
        while (i + 1 < messages.length && messages[i + 1]!.role === 'tool') {
          i++
          const toolMsg = messages[i]!
          if (toolMsg.toolCallId) answered.add(toolMsg.toolCallId)
          result.push({
            type: 'function_call_output',
            call_id: toolMsg.toolCallId,
            output: toolMsg.content
          })
        }
        // 为缺少对应输出的 call_id 补齐兜底结果，避免服务端因悬挂调用报错
        for (const call of toolCalls) {
          if (!answered.has(call.id)) {
            result.push({
              type: 'function_call_output',
              call_id: call.id,
              output: 'Error: Aborted'
            })
          }
        }
      }
    } else if (msg.role === 'tool') {
      result.push({ type: 'function_call_output', call_id: msg.toolCallId, output: msg.content })
    }
  }

  return result
}

function toResponsesTools(tools: readonly AiTool[]): unknown[] {
  // Responses API 的工具是扁平结构（name/description/parameters 直挂在工具对象上）
  return tools.map((tool) => ({
    type: 'function',
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }))
}

function defaultApplyReasoning(level: string, body: Record<string, unknown>) {
  body.reasoning = { effort: level }
}

/**
 * 构造 OpenAI Responses API（/v1/responses）请求体。
 * systemPrompt 写入 instructions；消息历史转 input 项（用户消息附件转
 * input_text / input_image 分片、工具调用转 function_call / function_call_output）。
 */
export function buildOpenAIResponsesBody(
  options: OpenAIResponsesBodyOptions
): Record<string, unknown> {
  const { model, messages, systemPrompt, tools, reasoningLevel, applyReasoning, extraBody } =
    options
  const stream = options.stream ?? false

  const body: Record<string, unknown> = {
    ...extraBody,
    model,
    stream,
    ...(systemPrompt ? { instructions: systemPrompt } : {}),
    input: toResponsesInput(messages),
    ...(tools?.length ? { tools: toResponsesTools(tools) } : {})
  }

  if (reasoningLevel) {
    const apply = applyReasoning ?? defaultApplyReasoning
    apply(reasoningLevel, body)
  }

  return body
}

interface AccumulatedFunctionCall {
  id: string
  name: string
  arguments: string
}

/**
 * 逐事件解析 OpenAI Responses API 的 SSE 流。
 * 依据每个 data 帧的 `type` 字段路由：
 * - `response.output_text.delta` → 文本增量；
 * - `response.reasoning_summary_text.delta` / `response.reasoning_text.delta` → 思考增量；
 * - `response.output_item.added` + `response.function_call_arguments.delta` 累积工具调用，
 *   以 `response.output_item.done` 的完整 item 为准抛出（缺 done 时流末兜底 flush）；
 * - `response.completed` / `response.incomplete` → usage（input_tokens / output_tokens 风格）；
 * - `response.failed` / `error` → 抛出异常，由请求层统一报错。
 * 读流抛出的异常原样向外传播，由调用方决定错误处理；signal 中断即停止读取。
 */
export async function parseOpenAIResponsesSSEStream(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal | undefined,
  handlers: AiStreamHandlers
): Promise<void> {
  // Responses API 的 function_call 参数增量按 item_id 归属；done 事件携带完整 item
  const accumulated = new Map<string, AccumulatedFunctionCall>()

  const emitToolCall = (id: string, name: string, args: string) => {
    if (handlers.onToolCall && id && name) {
      handlers.onToolCall({ id, name, arguments: args })
    }
  }

  const flushFunctionCalls = () => {
    for (const call of accumulated.values()) {
      emitToolCall(call.id, call.name, call.arguments)
    }
    accumulated.clear()
  }

  const handleData = (data: string) => {
    if (data === '[DONE]') return

    let event: unknown
    try {
      event = JSON.parse(data)
    } catch {
      return
    }
    if (!isRecord(event)) return
    const type = typeof event.type === 'string' ? event.type : ''

    if (type === 'response.output_text.delta') {
      if (typeof event.delta === 'string' && event.delta) {
        handlers.onTextDelta(event.delta)
      }
      return
    }

    if (
      type === 'response.reasoning_summary_text.delta' ||
      type === 'response.reasoning_text.delta'
    ) {
      if (typeof event.delta === 'string' && event.delta) {
        handlers.onReasoningDelta?.(event.delta)
      }
      return
    }

    if (type === 'response.output_item.added') {
      const item = isRecord(event.item) ? event.item : undefined
      if (item?.type === 'function_call' && typeof item.id === 'string') {
        accumulated.set(item.id, {
          id: typeof item.call_id === 'string' ? item.call_id : '',
          name: typeof item.name === 'string' ? item.name : '',
          arguments: typeof item.arguments === 'string' ? item.arguments : ''
        })
      }
      return
    }

    if (type === 'response.function_call_arguments.delta') {
      const itemId = typeof event.item_id === 'string' ? event.item_id : ''
      const call = accumulated.get(itemId)
      if (call && typeof event.delta === 'string') {
        call.arguments += event.delta
      }
      return
    }

    if (type === 'response.output_item.done') {
      const item = isRecord(event.item) ? event.item : undefined
      if (item?.type === 'function_call') {
        const itemId = typeof item.id === 'string' ? item.id : ''
        const id = typeof item.call_id === 'string' ? item.call_id : ''
        const name = typeof item.name === 'string' ? item.name : ''
        const args = typeof item.arguments === 'string' ? item.arguments : ''
        // done 的完整 item 为准；无 call_id 时退回累积结果（部分兼容端点只在 added 里给）
        const fallback = accumulated.get(itemId)
        emitToolCall(
          id || fallback?.id || '',
          name || fallback?.name || '',
          args || fallback?.arguments || ''
        )
        if (itemId) accumulated.delete(itemId)
      }
      return
    }

    if (type === 'response.completed' || type === 'response.incomplete') {
      const response = isRecord(event.response) ? event.response : undefined
      const usage = parseOpenAIUsage(response?.usage)
      if (usage) handlers.onUsage?.(usage)
      return
    }

    if (type === 'response.failed') {
      const response = isRecord(event.response) ? event.response : undefined
      const error = isRecord(response?.error) ? response.error : undefined
      throw new Error(
        typeof error?.message === 'string' && error.message
          ? error.message
          : '模型返回 response.failed 事件'
      )
    }

    if (type === 'error') {
      throw new Error(
        typeof event.message === 'string' && event.message ? event.message : '模型返回 error 事件'
      )
    }
  }

  await pumpSSEData(body, signal, handleData)

  if (!signal?.aborted) flushFunctionCalls()
}
