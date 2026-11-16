import {
  buildOpenAIBody,
  buildOpenAIResponsesBody,
  parseOpenAIResponsesSSEStream,
  parseOpenAISSEStream,
  postOpenAI,
  toOpenAIHttpError
} from '@veltra/utils'

import type { ChatModelOption, ChatProvider } from '../../providers'
import type { ChatTransport, ChatTransportHandlers, ChatTransportRequest } from '../types'

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

/** 单次请求尝试：协议 + 地址 */
interface RequestAttempt {
  kind: 'responses' | 'chat'
  url: string
}

/** 单个 Provider 解析后的请求方案（多尝试仅出现在 auto 裸 base URL 的探测链） */
interface ProviderRequestPlan {
  attempts: RequestAttempt[]
}

/**
 * 按 Provider 的 mode 与 endpoint 解析请求尝试。
 * 显式 `responses` / `chat` 与后缀可识别的 endpoint 原样使用、单次请求；
 * 缺省 auto 且 endpoint 为裸 base URL（如 `https://api.openai.com/v1`）时给出探测链：
 * **优先** `<base>/responses`，返回 404 / 405 时依次回退 `<base>/chat/completions`
 * 与 endpoint 原地址（兼容历史配置——裸 endpoint 本身就是 chat 地址）。
 */
function resolveRequestPlan(provider: ChatProvider): ProviderRequestPlan {
  const endpoint = provider.endpoint
  const mode = provider.mode ?? 'auto'

  if (mode === 'chat') return { attempts: [{ kind: 'chat', url: endpoint }] }
  if (mode === 'responses') return { attempts: [{ kind: 'responses', url: endpoint }] }

  if (/\/responses\/?$/i.test(endpoint)) return { attempts: [{ kind: 'responses', url: endpoint }] }
  if (/\/chat\/completions\/?$/i.test(endpoint))
    return { attempts: [{ kind: 'chat', url: endpoint }] }

  const base = endpoint.replace(/\/+$/, '')
  return {
    attempts: [
      { kind: 'responses', url: `${base}/responses` },
      { kind: 'chat', url: `${base}/chat/completions` },
      { kind: 'chat', url: endpoint }
    ]
  }
}

/** 校验 providers 并展开扁平模型列表 */
function flattenModels(providers: ChatProvider[]): {
  models: ChatModelOption[]
  byModelId: Map<string, { provider: ChatProvider; plan: ProviderRequestPlan }>
} {
  if (!providers.length) {
    throw new Error('[createOpenAITransport] providers 不能为空')
  }

  const models: ChatModelOption[] = []
  const byModelId = new Map<string, { provider: ChatProvider; plan: ProviderRequestPlan }>()
  for (const provider of providers) {
    if (!provider.models?.length) {
      throw new Error(`[createOpenAITransport] Provider "${provider.id}" 未配置 models`)
    }
    const plan = resolveRequestPlan(provider)
    for (const model of provider.models) {
      if (byModelId.has(model.id)) {
        throw new Error(
          `[createOpenAITransport] 模型 id "${model.id}" 重复（跨 Provider 须全局唯一）`
        )
      }
      byModelId.set(model.id, { provider, plan })
      models.push({ ...model, providerId: provider.id, providerLabel: provider.label })
    }
  }

  return { models, byModelId }
}

/**
 * 创建 OpenAI 兼容协议的传输层。
 * 按 request.model 路由到对应 Provider，并按其 mode 选择协议：
 * OpenAI Responses API（/v1/responses）优先、chat/completions 兜底
 * （裸 base URL 自动探测可用地址，命中后记忆直连）；
 * 请求体构造、fetch、SSE 解析与错误处理复用 `@veltra/utils` 通用层。
 */
export function createOpenAITransport(options: OpenAITransportOptions): OpenAITransport {
  const { providers, headers: globalHeaders, body: globalBody } = options
  const { models, byModelId } = flattenModels(providers)
  const defaultModel = models[0]!.id

  // 探测链命中（2xx）后记忆直连地址，后续请求不再逐级探测
  const resolved = new WeakMap<ChatProvider, RequestAttempt>()

  const send: ChatTransport = async (
    request: ChatTransportRequest,
    handlers: ChatTransportHandlers
  ) => {
    const { messages, systemPrompt, tools, signal, reasoningLevel } = request
    const modelId = request.model ?? defaultModel
    const entry = byModelId.get(modelId)

    if (!entry) {
      handlers.onError?.(new Error(`未找到模型 "${modelId}" 对应的 Provider`))
      return
    }

    const { provider, plan } = entry
    const headers = { ...globalHeaders, ...provider.headers }
    const bodyOptions = {
      model: modelId,
      messages,
      systemPrompt,
      tools,
      stream: true,
      reasoningLevel,
      applyReasoning: provider.applyReasoning,
      extraBody: globalBody
    }
    const attempts = resolved.has(provider) ? [resolved.get(provider)!] : plan.attempts

    // 递归尝试代替循环，避免 await-in-loop；仅探测链的 404 / 405 会向后推进
    const attemptStream = async (index: number): Promise<void> => {
      const attempt = attempts[index]
      if (!attempt) return

      const response = await postOpenAI(
        {
          url: attempt.url,
          apiKey: provider.apiKey,
          headers,
          body:
            attempt.kind === 'responses'
              ? buildOpenAIResponsesBody(bodyOptions)
              : buildOpenAIBody(bodyOptions),
          signal
        },
        handlers.onError
      )
      // null：网络错误已报 onError 或 signal 中断静默
      if (!response) return

      if ((response.status === 404 || response.status === 405) && index + 1 < attempts.length) {
        return attemptStream(index + 1)
      }

      if (!response.ok) {
        handlers.onError?.(await toOpenAIHttpError(response))
        return
      }

      resolved.set(provider, attempt)

      if (!response.body) {
        handlers.onError?.(new Error('响应不包含可读取的流'))
        return
      }

      try {
        if (attempt.kind === 'responses') {
          await parseOpenAIResponsesSSEStream(response.body, signal, handlers)
        } else {
          await parseOpenAISSEStream(response.body, signal, handlers)
        }
      } catch (error) {
        // signal 中断静默；response.failed / error 事件与流异常在此上报
        if (!signal.aborted) {
          handlers.onError?.(error instanceof Error ? error : new Error(String(error)))
        }
      }
    }

    await attemptStream(0)
  }

  return Object.assign(send, { models, defaultModel })
}
