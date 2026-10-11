import { buildOpenAIBody, parseOpenAICompletionText, parseOpenAISSEStream } from './openai'
import type { AiStreamHandlers, AiTextRequestOptions } from './types'

/** OpenAI 兼容请求的发送选项（body 用 buildOpenAIBody 构造） */
export interface OpenAIRequestOptions {
  /** OpenAI 兼容 chat/completions 完整请求地址 */
  url: string
  /** Bearer Token，缺省不带 Authorization 头 */
  apiKey?: string
  /** 额外请求头（覆盖同名默认头） */
  headers?: Record<string, string>
  /** 请求体 */
  body: Record<string, unknown>
  /** 中断信号 */
  signal?: AbortSignal
}

/** OpenAI 兼容流式请求回调 */
export interface OpenAIStreamCallbacks extends AiStreamHandlers {
  /** 请求错误（网络错误、非 2xx、流中断）；signal 中断时静默 */
  onError?(error: Error): void
}

/**
 * 发送 OpenAI 兼容 POST 并统一错误处理。
 * 返回 null 表示失败（错误已报给 onError）或已中断（静默）。
 */
async function postOpenAI(
  options: OpenAIRequestOptions,
  onError?: (error: Error) => void
): Promise<Response | null> {
  const { url, apiKey, headers, body, signal } = options

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        ...headers
      },
      body: JSON.stringify(body)
    })
  } catch (error) {
    if (!signal?.aborted) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
    }
    return null
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    onError?.(new Error(`请求失败（${response.status}）：${text || response.statusText}`))
    return null
  }

  return response
}

/**
 * OpenAI 兼容流式请求：fetch + SSE 解析。
 * 手写 fetch，无第三方依赖；错误经 onError 报告，signal 中断静默。
 *
 * @returns 流是否完整读取（false 表示失败或已中断）
 */
export async function requestOpenAIStream(
  options: OpenAIRequestOptions,
  callbacks: OpenAIStreamCallbacks
): Promise<boolean> {
  const response = await postOpenAI(options, callbacks.onError)
  if (!response) return false

  if (!response.body) {
    callbacks.onError?.(new Error('响应不包含可读取的流'))
    return false
  }

  try {
    await parseOpenAISSEStream(response.body, options.signal, callbacks)
  } catch (error) {
    if (!options.signal?.aborted) {
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)))
    }
    return false
  }

  return true
}

/**
 * 面向组件的单配置请求入口。
 * 用 `systemPrompt`（可选）+ `prompt` 组装 messages，按 `config.stream` 走流式 / 非流式：
 * - 流式：增量逐段触发 onDelta，流完整结束后以拼接文本触发 onSuccess；
 * - 非流式：解析 JSON 响应，以完整文本触发 onSuccess。
 * 失败触发 onError；signal 中断不触发任何回调（静默）。
 */
export async function requestAiText(options: AiTextRequestOptions): Promise<void> {
  const { config, prompt, systemPrompt, signal, onDelta, onSuccess, onError } = options

  const body = buildOpenAIBody({
    model: config.model,
    messages: [{ role: 'user', content: prompt }],
    systemPrompt,
    stream: config.stream ?? false,
    reasoningLevel: config.reasoningLevel
  })

  if (config.stream) {
    let text = ''
    const completed = await requestOpenAIStream(
      { url: config.url, apiKey: config.apiKey, body, signal },
      {
        onTextDelta(delta) {
          text += delta
          onDelta?.(delta)
        },
        onError
      }
    )
    if (completed) onSuccess?.(text)
    return
  }

  const response = await postOpenAI(
    { url: config.url, apiKey: config.apiKey, body, signal },
    onError
  )
  if (!response) return

  let json: unknown
  try {
    json = await response.json()
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)))
    return
  }

  const text = parseOpenAICompletionText(json)
  if (text == null) {
    onError?.(new Error('响应不包含可解析的文本内容'))
    return
  }

  onSuccess?.(text)
}
