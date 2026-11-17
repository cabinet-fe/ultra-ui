import { Hono } from 'hono'
import type { Context } from 'hono'

/**
 * DeepSeek 会话代理（playground dev-only）。
 * 浏览器只访问同源相对路径 `/ai/responses`、`/ai/chat/completions`，API Key 只存在服务端环境变量，
 * 避免像 `VITE_*` 变量一样被编译进前端产物。
 *
 * 模型 id 默认直接透传 `deepseek-v4-flash` / `deepseek-v4-pro`；
 * 若上游别名变化，可用 DEEPSEEK_V4_FLASH_MODEL / DEEPSEEK_V4_PRO_MODEL 覆盖。
 */
const DEFAULT_BASE_URL = 'https://api.deepseek.com'

const DEFAULT_REASONING_LEVELS = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' }
] as const

const DEFAULT_FRONTEND_MODELS = [
  {
    id: 'deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    description: '快速通用对话，低延迟高吞吐',
    reasoningLevels: DEFAULT_REASONING_LEVELS,
    defaultReasoningLevel: 'low'
  },
  {
    id: 'deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    description: '旗舰推理与 Agent 任务',
    reasoningLevels: DEFAULT_REASONING_LEVELS,
    defaultReasoningLevel: 'medium'
  }
] as const

export interface DeepSeekProxyConfig {
  apiKey: string
  baseUrl: string
  defaultModel: string
  modelMap: Readonly<Record<string, string>>
}

function trimOrEmpty(value: string | undefined): string {
  return value?.trim() ?? ''
}

function normalizeBaseUrl(raw: string | undefined): string {
  const value = trimOrEmpty(raw)
  return (value || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

/** 从环境变量解析代理配置；测试时可传入自定义 env */
export function resolveDeepSeekProxyConfig(
  env: Record<string, string | undefined> = process.env
): DeepSeekProxyConfig {
  return {
    apiKey: trimOrEmpty(env.DEEPSEEK_API_KEY) || trimOrEmpty(env.VITE_DEEPSEEK_KEY),
    baseUrl: normalizeBaseUrl(env.DEEPSEEK_BASE_URL),
    defaultModel: trimOrEmpty(env.DEEPSEEK_DEFAULT_MODEL) || 'deepseek-v4-flash',
    modelMap: {
      'deepseek-v4-flash': trimOrEmpty(env.DEEPSEEK_V4_FLASH_MODEL) || 'deepseek-v4-flash',
      'deepseek-v4-pro': trimOrEmpty(env.DEEPSEEK_V4_PRO_MODEL) || 'deepseek-v4-pro'
    }
  }
}

type JsonObject = Record<string, unknown>

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 校验消息数组：只要求 OpenAI 兼容的最小形状，其余字段原样透传 */
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

function invalidRequest(c: Context, message: string) {
  return c.json({ error: { message, type: 'invalid_request_error', code: 'INVALID_REQUEST' } }, 400)
}

async function readJsonObject(
  c: Context
): Promise<{ ok: true; value: JsonObject } | { ok: false; response: Response }> {
  let parsed: unknown
  try {
    parsed = await c.req.json()
  } catch {
    return { ok: false, response: invalidRequest(c, '请求体不是合法 JSON') }
  }
  if (!isRecord(parsed)) {
    return { ok: false, response: invalidRequest(c, '请求体必须是 JSON 对象') }
  }
  return { ok: true, value: parsed }
}

/** 请求体校验结果：通过则给出补齐 model / stream 后的上游请求体 */
type UpstreamBodyValidation =
  | { ok: true; upstreamBody: JsonObject }
  | { ok: false; message: string }

/** 回填 model / stream：model 未传用默认值并按 modelMap 映射上游模型，stream 缺省 true */
function applyModelAndStream(
  body: JsonObject,
  config: DeepSeekProxyConfig
): UpstreamBodyValidation {
  if ('stream' in body && typeof body.stream !== 'boolean') {
    return { ok: false, message: 'stream 必须是布尔值' }
  }

  const requestedModel = body.model
  if (
    requestedModel !== undefined &&
    (typeof requestedModel !== 'string' || requestedModel === '')
  ) {
    return { ok: false, message: 'model 必须是非空字符串' }
  }

  const model = typeof requestedModel === 'string' ? requestedModel : config.defaultModel
  return {
    ok: true,
    upstreamBody: { ...body, model: config.modelMap[model] ?? model, stream: body.stream ?? true }
  }
}

function validateChatCompletionsBody(
  body: JsonObject,
  config: DeepSeekProxyConfig
): UpstreamBodyValidation {
  const { messages } = body
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, message: 'messages 必须是非空数组' }
  }
  if (!messages.every(isChatMessage)) {
    return { ok: false, message: 'messages 中存在不合法消息（缺少合法 role/content）' }
  }

  return applyModelAndStream(body, config)
}

/** Responses API 只额外校验 input：非空字符串或非空数组，其余字段原样透传 */
function validateResponsesBody(
  body: JsonObject,
  config: DeepSeekProxyConfig
): UpstreamBodyValidation {
  const { input } = body
  const hasInput =
    (typeof input === 'string' && input !== '') || (Array.isArray(input) && input.length > 0)
  if (!hasInput) {
    return { ok: false, message: 'input 必须是非空字符串或非空数组' }
  }

  return applyModelAndStream(body, config)
}

/** AI 会话代理 Hono 子应用：由 server/dev.ts 挂到 `/ai` */
export const deepseekApp = new Hono()

/** GET /ai —— 会话代理活体文档；只描述端点与环境变量，不返回 API Key */
deepseekApp.get('/', (c) => {
  return c.json({
    name: '@veltra playground DeepSeek chat proxy（dev-only）',
    models: DEFAULT_FRONTEND_MODELS,
    endpoints: {
      models: { method: 'GET', path: '/ai/models' },
      responses: {
        method: 'POST',
        path: '/ai/responses',
        request:
          'OpenAI Responses API 兼容请求体；model 可选 deepseek-v4-flash / deepseek-v4-pro，stream 默认 true',
        note: 'transport 裸 base（/ai）auto 模式优先探测本端点，上游为 DeepSeek /responses'
      },
      chatCompletions: {
        method: 'POST',
        path: '/ai/chat/completions',
        request:
          'OpenAI 兼容 chat.completions 请求体；model 可选 deepseek-v4-flash / deepseek-v4-pro，stream 默认 true',
        note: 'API Key 仅由服务端环境变量 DEEPSEEK_API_KEY 提供，请求体与响应均不携带密钥'
      }
    },
    configuration: {
      DEEPSEEK_API_KEY: '必填；服务端读取，不会下发浏览器',
      DEEPSEEK_BASE_URL: '可选，默认 https://api.deepseek.com',
      DEEPSEEK_DEFAULT_MODEL: '可选，默认 deepseek-v4-flash',
      DEEPSEEK_V4_FLASH_MODEL: '可选，前端 id deepseek-v4-flash 的上游模型映射',
      DEEPSEEK_V4_PRO_MODEL: '可选，前端 id deepseek-v4-pro 的上游模型映射'
    }
  })
})

/** GET /ai/models — 返回前端选择器可用的模型列表（调试/活体探测用） */
deepseekApp.get('/models', (c) => {
  return c.json({ object: 'list', data: DEFAULT_FRONTEND_MODELS })
})

/** 通用转发：校验请求体后 POST 到 DeepSeek 上游；上游错误透传，SSE / JSON 按流式标记回传 */
async function proxyToDeepSeek(
  c: Context,
  upstreamPath: string,
  validate: (body: JsonObject, config: DeepSeekProxyConfig) => UpstreamBodyValidation
): Promise<Response> {
  const config = resolveDeepSeekProxyConfig()
  if (!config.apiKey) {
    return c.json(
      {
        error: {
          message:
            '未配置 DeepSeek API Key：请在 playground/.env 设置 DEEPSEEK_API_KEY（兼容回退 VITE_DEEPSEEK_KEY）',
          type: 'server_error',
          code: 'DEEPSEEK_NOT_CONFIGURED'
        }
      },
      503
    )
  }

  const body = await readJsonObject(c)
  if (!body.ok) return body.response

  const prepared = validate(body.value, config)
  if (!prepared.ok) {
    return invalidRequest(c, prepared.message)
  }

  const isStream = prepared.upstreamBody.stream === true

  let upstream: Response
  try {
    upstream = await fetch(`${config.baseUrl}${upstreamPath}`, {
      method: 'POST',
      signal: c.req.raw.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: isStream ? 'text/event-stream' : 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(prepared.upstreamBody)
    })
  } catch (error) {
    if (!c.req.raw.signal.aborted) {
      return c.json(
        {
          error: {
            message: `无法连接 DeepSeek：${error instanceof Error ? error.message : String(error)}`,
            type: 'server_error',
            code: 'DEEPSEEK_UNREACHABLE'
          }
        },
        502
      )
    }
    return new Response(null, { status: 499 })
  }

  // 上游错误直接透传，让前端 transport 把 DeepSeek 的 error.message 展示出来
  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '')
    return new Response(text || JSON.stringify({ error: { message: upstream.statusText } }), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'text/event-stream',
      ...(isStream ? { 'Cache-Control': 'no-cache' } : {})
    }
  })
}

/** POST /ai/chat/completions — OpenAI 兼容 SSE 转发到 DeepSeek */
deepseekApp.post('/chat/completions', (c) =>
  proxyToDeepSeek(c, '/chat/completions', validateChatCompletionsBody)
)

/** POST /ai/responses — OpenAI Responses API 转发；transport 裸 base（/ai）auto 模式优先探测 */
deepseekApp.post('/responses', (c) => proxyToDeepSeek(c, '/responses', validateResponsesBody))
