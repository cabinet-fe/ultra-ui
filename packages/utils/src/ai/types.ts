/**
 * AI 服务商配置（OpenAI 兼容 chat/completions）。
 * 组件实例 prop 与全局配置（useConfig 的 ai 键）字段级合并后使用。
 */
export interface AiProviderConfig {
  /** OpenAI 兼容 chat/completions 的完整请求地址（语义同 @veltra/ai 的 endpoint） */
  url: string
  /** Bearer Token，缺省不带 Authorization 头 */
  apiKey?: string
  /** 模型 id */
  model: string
  /** 推理等级；缺省不写入请求体，提供时默认写 reasoning_effort */
  reasoningLevel?: string
  /** 是否流式返回，缺省 false（一次性返回完整文本） */
  stream?: boolean
}

/** 一次完整的工具调用（SSE 参数分片在内部累积完整后抛出） */
export interface AiToolCall {
  /** 调用 id（由模型生成） */
  id: string
  /** 工具名 */
  name: string
  /** 模型输出的原始 JSON 参数串 */
  arguments: string
}

/**
 * 请求侧消息的最小结构（内部消息模型转 wire 格式的入参形状）。
 * @veltra/ai 的 ChatMessage 满足该形状，可直接传入。
 */
export interface AiMessage {
  role: 'user' | 'assistant' | 'tool'
  content: string
  /** 用户消息图片附件（转 OpenAI image_url 内容分片） */
  attachments?: ReadonlyArray<{ dataUrl: string }>
  /** assistant 消息上的工具调用列表 */
  toolCalls?: ReadonlyArray<AiToolCall>
  /** role 为 tool 时关联的工具调用 id */
  toolCallId?: string
}

/**
 * 请求侧工具定义的最小结构。
 * @veltra/ai 的 ChatTool 满足该形状，可直接传入。
 */
export interface AiTool {
  /** 工具名（传给模型，需唯一） */
  name: string
  /** 工具描述（传给模型） */
  description: string
  /** 参数 JSON Schema（原样传给模型） */
  parameters: Record<string, unknown>
}

/**
 * 一次模型请求的 token 用量。
 * 仅包含接口实际返回的字段；缓存类数字缺省为 undefined，不补 0。
 */
export interface AiTokenUsage {
  /** 输入 token */
  promptTokens: number
  /** 输出 token */
  completionTokens: number
  /** 合计 token */
  totalTokens: number
  /**
   * 缓存命中。
   * 来源：`prompt_tokens_details.cached_tokens` / `prompt_cache_hit_tokens` /
   * `cache_read_input_tokens` / `cached_tokens`。
   */
  cacheHitTokens?: number
  /**
   * 缓存未命中。
   * 来源：`prompt_cache_miss_tokens`；若无该字段但有命中与 prompt，则为 prompt − 命中。
   */
  cacheMissTokens?: number
  /** 写入缓存（Anthropic 风格 `cache_creation_input_tokens`），有才有 */
  cacheCreationTokens?: number
}

/** OpenAI 兼容 SSE 流事件回调（请求错误由请求层统一处理，不经此抛出） */
export interface AiStreamHandlers {
  /** 文本增量 */
  onTextDelta(delta: string): void
  /** 思考内容增量 */
  onReasoningDelta?(delta: string): void
  /** 一次完整的工具调用（流式参数片段在内部累积完整后才抛出） */
  onToolCall?(call: AiToolCall): void
  /** 本次请求的 token 用量（流式末包）；接口未返回时不调用，不填 0 充数 */
  onUsage?(usage: AiTokenUsage): void
}

/** requestAiText 的入参：面向组件的单配置请求 */
export interface AiTextRequestOptions {
  /** 服务商配置（url / apiKey / model / reasoningLevel / stream） */
  config: AiProviderConfig
  /** 用户提示词（作为 user 消息） */
  prompt: string
  /** 系统提示词，存在时作为首条 system 消息 */
  systemPrompt?: string
  /** 中断信号；中断后不触发任何回调（静默） */
  signal?: AbortSignal
  /** 文本增量，仅流式时逐段触发 */
  onDelta?(delta: string): void
  /** 成功：流式为全部增量拼接，非流式为完整响应文本 */
  onSuccess?(text: string): void
  /** 失败：网络错误、非 2xx 响应、流中断 */
  onError?(error: Error): void
}
