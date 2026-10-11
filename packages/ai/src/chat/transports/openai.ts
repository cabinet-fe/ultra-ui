import { buildOpenAIBody, requestOpenAIStream } from '@veltra/utils'

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

/**
 * 创建 OpenAI 兼容协议的传输层（chat/completions SSE）。
 * 按 request.model 路由到对应 Provider 的 endpoint；
 * 请求体构造、fetch、SSE 解析与错误处理复用 `@veltra/utils` 通用层。
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

    const requestBody = buildOpenAIBody({
      model: modelId,
      messages,
      systemPrompt,
      tools,
      stream: true,
      reasoningLevel,
      applyReasoning: provider.applyReasoning,
      extraBody: globalBody
    })

    // fetch + SSE 解析 + 错误处理均由通用层完成；错误经 onError 报告，signal 中断静默
    await requestOpenAIStream(
      {
        url: provider.endpoint,
        apiKey: provider.apiKey,
        headers: { ...globalHeaders, ...provider.headers },
        body: requestBody,
        signal
      },
      handlers
    )
  }

  return Object.assign(send, { models, defaultModel })
}
