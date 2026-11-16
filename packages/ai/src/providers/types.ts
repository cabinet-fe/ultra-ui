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
  /** 模型一句话描述（选择器面板副标题） */
  description?: string
  /** 未设或空数组 → 不展示推理选择器 */
  reasoningLevels?: ChatReasoningLevel[]
  /** 默认推理等级（须落在 reasoningLevels 内） */
  defaultReasoningLevel?: string
  /** 上下文窗口上限（token）。配置后输入栏用量环按「最近一次请求总 token / 上限」显示占比 */
  contextWindow?: number
}

/** 模型服务商配置（内嵌 models） */
export interface ChatProvider {
  id: string
  /** UI 显示名 */
  label?: string
  /** 完整 http(s) URL 或相对路径，如 /api/ai/chat */
  endpoint: string
  /**
   * 请求协议模式。
   * - `responses`：OpenAI Responses API（/v1/responses），endpoint 原样使用；
   * - `chat`：chat/completions（历史行为），endpoint 原样使用；
   * - 缺省 `auto`：endpoint 以 `/responses` 结尾用 responses、以 `/chat/completions`
   *   结尾用 chat；其余视为 base URL（如 `https://api.openai.com/v1`），**优先**请求
   *   `<base>/responses`，返回 404 / 405 时依次回退 `<base>/chat/completions` 与
   *   endpoint 原地址（chat 格式，兼容裸地址即 chat 端点的历史配置）。
   *   探测命中（2xx）后记忆该地址，后续请求直连不再探测。
   */
  mode?: 'responses' | 'chat' | 'auto'
  /** API Key（有则带 Bearer；相对路径场景可省略，走 cookie/`headers`） */
  apiKey?: string
  /** Provider 级额外请求头 */
  headers?: Record<string, string>
  /**
   * 将选中的推理等级写入 body。
   * 缺省：chat 模式写 `body.reasoning_effort`，responses 模式写 `body.reasoning.effort`。
   */
  applyReasoning?: (level: string, body: Record<string, unknown>) => void
  models: ChatModel[]
}

/** UI / useChat 使用的扁平模型项（带 providerId） */
export interface ChatModelOption extends ChatModel {
  providerId: string
  providerLabel?: string
}
