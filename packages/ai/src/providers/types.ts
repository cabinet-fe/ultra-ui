/** 推理等级选项（值不透明，由宿主/服务商约定） */
export interface ChatReasoningLevel {
  /** 写入请求的值 */
  value: string
  /** UI 文案 */
  label: string
}

/** 单个模型配置 */
export interface ChatModel {
  /** 模型 id（跨 Provider 全局唯一） */
  id: string
  /** UI 显示名，缺省取 id */
  label?: string
  /** 未设或空数组 → 不展示推理选择器 */
  reasoningLevels?: ChatReasoningLevel[]
  /** 默认推理等级（须落在 reasoningLevels 内） */
  defaultReasoningLevel?: string
}

/** 模型服务商配置（内嵌 models） */
export interface ChatProvider {
  id: string
  /** UI 显示名 */
  label?: string
  /** 完整 http(s) URL 或相对路径，如 /api/ai/chat */
  endpoint: string
  /** API Key（有则带 Bearer；相对路径场景可省略，走 cookie/`headers`） */
  apiKey?: string
  /** Provider 级额外请求头 */
  headers?: Record<string, string>
  /**
   * 将选中的推理等级写入 body。
   * 缺省：若 level 存在则 `body.reasoning_effort = level`（OpenAI 兼容约定）。
   */
  applyReasoning?: (level: string, body: Record<string, unknown>) => void
  models: ChatModel[]
}

/** UI / useChat 使用的扁平模型项（带 providerId） */
export interface ChatModelOption extends ChatModel {
  providerId: string
  providerLabel?: string
}
