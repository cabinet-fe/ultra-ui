import { Hono } from 'hono'

import { resolveDeepSeekProxyConfig, type DeepSeekProxyConfig } from './deepseek'

/**
 * 智慧表格 AI 代理（playground dev-only）：按 bedrock `internal/ai/service/chat_proxy.go`
 * 同款实现移植为 Bun + TS + Hono——
 * 请求 model 匹配模型目录、API Key 仅服务端持有、合并模型默认参数与 reasoning_effort、
 * 强制 stream: true、SSE 逐行透传（content / reasoning_content / [DONE]）、上游错误透传。
 * 服务商配置复用 playground/.env 的 DEEPSEEK_* 变量族（见 server/deepseek.ts）。
 */

const REASONING_LEVELS = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' }
] as const

/** 模型目录：前端选择器直接消费；defaultParams 为 bedrock 同款的模型默认参数（可被请求附加参数覆盖） */
const MODEL_CATALOG = [
  {
    id: 'deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    description: '表格生成与整理的默认模型，低延迟',
    reasoningLevels: REASONING_LEVELS,
    defaultReasoningLevel: 'low',
    defaultParams: { temperature: 0.3, max_tokens: 2048 }
  },
  {
    id: 'deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    description: '复杂指令的字段生成与整理',
    reasoningLevels: REASONING_LEVELS,
    defaultReasoningLevel: 'medium',
    defaultParams: { temperature: 0.3, max_tokens: 4096 }
  }
] as const

type JsonObject = Record<string, unknown>

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isChatMessage(value: unknown): boolean {
  if (!isRecord(value)) return false
  if (
    typeof value.role !== 'string' ||
    !['system', 'user', 'assistant', 'tool'].includes(value.role)
  ) {
    return false
  }
  const { content } = value
  return (
    content === undefined ||
    content === null ||
    typeof content === 'string' ||
    Array.isArray(content)
  )
}

/** 上游 /chat/completions 地址：base URL 去尾斜杠后按需补全（bedrock 同款拼接） */
function chatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '')
  return trimmed.endsWith('/chat/completions') ? trimmed : `${trimmed}/chat/completions`
}

/** 校验请求并组装上游载荷：默认参数 ← 请求附加参数 ← model/messages/stream/reasoning_effort */
function prepareUpstreamBody(
  body: JsonObject,
  config: DeepSeekProxyConfig
): { ok: true; upstreamBody: JsonObject } | { ok: false; message: string } {
  const requested = typeof body.model === 'string' ? body.model.trim() : ''
  const modelId = requested || config.defaultModel
  const catalog = MODEL_CATALOG.find((m) => m.id === modelId)
  if (!catalog) {
    return { ok: false, message: `未找到可用模型配置或对应服务商已禁用: ${modelId}` }
  }

  const messages = body.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, message: 'messages 必须是非空数组' }
  }
  if (!messages.every(isChatMessage)) {
    return { ok: false, message: 'messages 中存在不合法消息（缺少合法 role/content）' }
  }
  if (
    'reasoning_effort' in body &&
    (typeof body.reasoning_effort !== 'string' || body.reasoning_effort.trim() === '')
  ) {
    return { ok: false, message: 'reasoning_effort 必须是非空字符串' }
  }

  const { reasoning_effort: reasoningEffort, ...extra } = body
  const upstreamBody: JsonObject = {
    ...catalog.defaultParams,
    ...extra,
    model: config.modelMap[modelId] ?? modelId,
    messages,
    stream: true
  }
  if (reasoningEffort !== undefined) {
    upstreamBody.reasoning_effort = reasoningEffort
  }
  return { ok: true, upstreamBody }
}

/** 上游 SSE 逐行透传：每凑齐一行立即写出（content / reasoning_content / [DONE] 原样过，不缓冲整包） */
function lineByLineUpstream(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let buffer = ''
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = body.getReader()
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          let newlineIndex = buffer.indexOf('\n')
          while (newlineIndex >= 0) {
            const line = buffer.slice(0, newlineIndex + 1)
            buffer = buffer.slice(newlineIndex + 1)
            controller.enqueue(encoder.encode(line))
            newlineIndex = buffer.indexOf('\n')
          }
        }
        const tail = buffer + decoder.decode()
        if (tail !== '') controller.enqueue(encoder.encode(tail))
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
    cancel(reason) {
      return body.cancel(reason)
    }
  })
}

/** 智慧表格 AI 代理 Hono 子应用：由 server/dev.ts 挂到 /smart-table/ai */
export const smartTableAiApp = new Hono()

/** GET /smart-table/ai/models — 模型目录（不含任何密钥） */
smartTableAiApp.get('/models', (c) => {
  return c.json({ object: 'list', data: MODEL_CATALOG })
})

/** POST /smart-table/ai/chat/completions — OpenAI 兼容请求，强制流式并逐行透传 SSE */
smartTableAiApp.post('/chat/completions', async (c) => {
  const config = resolveDeepSeekProxyConfig()
  if (!config.apiKey) {
    return c.json(
      {
        error: {
          message:
            '未配置 DeepSeek API Key：请在 playground/.env 设置 DEEPSEEK_API_KEY（兼容回退 VITE_DEEPSEEK_KEY）后重启 bun run server',
          type: 'server_error',
          code: 'SMART_TABLE_AI_NOT_CONFIGURED'
        }
      },
      503
    )
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json(
      {
        error: {
          message: '请求体不是合法 JSON',
          type: 'invalid_request_error',
          code: 'INVALID_REQUEST'
        }
      },
      400
    )
  }
  if (!isRecord(body)) {
    return c.json(
      {
        error: {
          message: '请求体必须是 JSON 对象',
          type: 'invalid_request_error',
          code: 'INVALID_REQUEST'
        }
      },
      400
    )
  }

  const prepared = prepareUpstreamBody(body, config)
  if (!prepared.ok) {
    return c.json(
      {
        error: { message: prepared.message, type: 'invalid_request_error', code: 'INVALID_REQUEST' }
      },
      400
    )
  }

  let upstream: Response
  try {
    upstream = await fetch(chatCompletionsUrl(config.baseUrl), {
      method: 'POST',
      signal: c.req.raw.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(prepared.upstreamBody)
    })
  } catch (error) {
    if (!c.req.raw.signal.aborted) {
      return c.json(
        {
          error: {
            message: `无法连接上游模型服务：${error instanceof Error ? error.message : String(error)}`,
            type: 'server_error',
            code: 'SMART_TABLE_AI_UNREACHABLE'
          }
        },
        502
      )
    }
    return new Response(null, { status: 499 })
  }

  // 上游非 200：状态码与错误体原样透传给前端
  if (upstream.status !== 200) {
    const text = await upstream.text().catch(() => '')
    return new Response(text || JSON.stringify({ error: { message: upstream.statusText } }), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(lineByLineUpstream(upstream.body as ReadableStream<Uint8Array>), {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
})
