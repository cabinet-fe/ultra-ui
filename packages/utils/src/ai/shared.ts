import type { AiAttachment, AiTokenUsage } from './types'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function readCount(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return undefined
  return Math.floor(value)
}

/**
 * 从 OpenAI 兼容 usage 对象解析。
 * 同时覆盖 chat/completions（prompt_tokens / completion_tokens）与
 * responses（input_tokens / output_tokens）两种字段风格。
 * 缓存字段只在源数据出现时写入；未命中可在「有命中 + prompt」时由差值得出。
 */
export function parseOpenAIUsage(raw: unknown): AiTokenUsage | null {
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

/** 附件是否按图片分片发送 */
export function isImageAttachment(att: AiAttachment): boolean {
  if (att.mimeType?.startsWith('image/')) return true
  if (att.dataUrl.startsWith('data:image/')) return true
  return false
}

/** 非图片附件转本地文本上下文块 */
export function formatFileAttachmentText(att: AiAttachment): string {
  const name = att.name || 'attachment'
  if (att.textContent != null && att.textContent !== '') {
    return `[附件: ${name}]\n\`\`\`\n${att.textContent}\n\`\`\``
  }
  return `[附件: ${name}]`
}

/**
 * 泵取 SSE 流：跨 chunk 逐行切分，把每个 `data:` 帧的载荷交给 onData。
 * 读流抛出的异常原样向外传播，由调用方决定错误处理；signal 中断即停止读取。
 */
export async function pumpSSEData(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal | undefined,
  onData: (data: string) => void
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

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
          onData(line.slice(5).trim())
        }
      }

      return pump()
    }

    await pump()

    if (buffer.trim().startsWith('data:')) {
      onData(buffer.trim().slice(5).trim())
    }
  } finally {
    reader.releaseLock()
  }
}
