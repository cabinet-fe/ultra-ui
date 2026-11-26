import type { Component } from 'vue'

export interface ChatAttachment {
  name: string
  mimeType: string
  /** 字节大小 */
  size: number
  /** base64 data URL（图片附件必有；非图片附件为空串） */
  dataUrl: string
  /** 非图片文本附件在本地提取的文本内容 */
  textContent?: string
}

export interface ChatToolCall {
  /** 调用 id（由模型生成） */
  id: string
  name: string
  /** 模型输出的原始 JSON 参数串 */
  arguments: string
  status: 'pending' | 'awaiting-confirm' | 'running' | 'success' | 'error' | 'rejected'
  /** 序列化后的工具执行结果 */
  result?: string
  error?: string
  /** 服务端下发的展示视图原文（session 模式可选） */
  view?: unknown
  /**
   * 这次调用挂到 assistant 消息上时，该消息 `content` 的字符长度。
   * `renderTo: 'reply'`：值为 0 且之后写出正文，卡片在正文前；
   * 大于等于最终长度或未设置时，卡片在整段正文后；
   * 落在中间时，同一气泡按该偏移切开为前文、卡片、后文。
   * 偏移在围栏代码块或成对行内代码内部时，切点挪到块外：离块首更近放在块前，否则放在块后。
   * `useChat` 与 session fold 在调用到达时写入。
   */
  contentOffset?: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  /** markdown 内容 */
  content: string
  reasoning?: string
  /** 用户消息携带的附件 */
  attachments?: ChatAttachment[]
  /** assistant 消息上的工具调用列表 */
  toolCalls?: ChatToolCall[]
  /** role 为 tool 时关联的工具调用 id */
  toolCallId?: string
  /** 消息状态，仅 assistant 消息使用 */
  status?: 'streaming' | 'done' | 'error' | 'aborted'
}

/** 队列中的待发送消息（会话进行中提交的消息按序排队） */
export interface ChatQueuedMessage {
  id: string
  content: string
  attachments?: ChatAttachment[]
}

interface ChatToolContext {
  toolCall: ChatToolCall
  /** 中断信号（用户点击停止时触发） */
  signal: AbortSignal
}

export interface ChatTool<A = any> {
  /** 工具名（传给模型，需唯一） */
  name: string
  description: string
  /** 参数 JSON Schema（原样传给模型） */
  parameters: Record<string, unknown>
  needsConfirm?: boolean
  /** 工具图标组件，缺省用内置状态图标（状态颜色/加载旋转仍作用于图标容器） */
  icon?: Component
  /** 工具显示名，缺省取 name */
  label?: string
  /**
   * 自定义工具卡片内容渲染（组件或渲染函数），props 为 ChatToolRenderProps。
   * 设置后替换卡片 body 的默认参数/结果展示；优先级高于 tool-<name> 插槽。
   * renderTo 为 'reply' 时改为渲染在回复流中，'panel' 时渲染在右侧侧边面板。
   */
  render?: Component
  /**
   * 渲染位置。缺省 'inline'：render 组件展示在步骤容器的工具卡片中；
   * 'reply'：作为主线内容块直接渲染在回复流外层，不进入步骤容器，且天然作为步骤组边界
   * （闭合前置步骤段、后续步骤单独成组）。与正文同属一条消息时位置跟 `ChatToolCall.contentOffset`：
   * 值为 0 且最终 content 非空时，卡片在正文前；大于等于最终长度或未设置时，卡片在整段正文后；
   * 落在中间时，同一气泡内按偏移切开为前文、卡片、后文（复制、状态行、操作区仍各一份）。
   * 偏移在围栏代码块或成对行内代码内部时，切点挪到块外：离块首更近放在块前，否则放在块后。
   * 无自定义 `render` 且无命中 `tool-<name>` 插槽时，兜底在外层渲染标准工具卡片。
   * 'panel'：步骤容器内保留工具卡片与「查看面板」入口，render 组件展示在对话区右侧侧边面板
   * （新调用自动打开面板，面板与会话区宽度可拖拽调节）。适合打开后台页面、表单、图表等较大交互区。
   */
  renderTo?: 'inline' | 'reply' | 'panel'
  /**
   * 侧边面板默认宽度（px，最小 320），仅 renderTo: 'panel' 时生效。
   * 聚焦到该工具的调用时应用；缺省时面板打开平分容器宽度（各占一半）；
   * 面板已打开时切换聚焦保持当前宽度（含用户拖拽结果）。
   */
  panelWidth?: number
  /**
   * 侧边面板标题，仅 renderTo: 'panel' 时生效。
   * 面板标题通常是「业务对象 + 动作」（如「编辑用户 · 张三」）而非工具名，
   * 可传固定字符串，或传函数按本次调用的参数动态生成。缺省取 label ?? name。
   */
  panelTitle?: string | ((toolCall: ChatToolCall) => string)
  /** 执行完成后是否自动折叠。缺省：renderTo 为 'panel' 时为 true；否则设置了 render 时为 false，否则为 true */
  autoCollapse?: boolean
  /**
   * 终结工具：执行成功后对话即结束，结果不再回灌模型生成额外文字（工具 UI 即最终答复）。
   * 适合天气卡片这类"UI 即答案"的工具，需配合 render 或 tool-<name> 插槽提供完整结果 UI。
   * 工具结果仍会记录到消息历史供后续轮次使用；执行失败/被拒绝时错误照常回灌模型。
   */
  terminal?: boolean
  /** 工具实现，返回值（或 Promise 返回值）会被 JSON 序列化后回灌给模型 */
  execute: (args: A, ctx: ChatToolContext) => unknown
}

/**
 * 服务端驱动模式下 tools 的合法形态：纯渲染元信息（执行在服务端）。
 * 没有 execute / description / parameters / needsConfirm / terminal。
 */
export interface ChatToolMeta {
  /** 与服务端 tool/call.name 匹配 */
  name: string
  /** 覆盖通用图标 */
  icon?: Component
  /** 工具显示名，缺省取 name */
  label?: string
  /** 自定义卡片/面板渲染，props 为 ChatToolRenderProps */
  render?: Component
  /** 渲染位置，语义同 ChatTool.renderTo */
  renderTo?: 'inline' | 'reply' | 'panel'
  /** 侧边面板默认宽度，语义同 ChatTool.panelWidth */
  panelWidth?: number
  /** 侧边面板标题，语义同 ChatTool.panelTitle */
  panelTitle?: string | ((toolCall: ChatToolCall) => string)
  autoCollapse?: boolean
}

/** 服务端下发的作业条项 */
export interface ChatJob {
  /** 稳定 id */
  id: string
  /** 作业类型（用于图标映射） */
  kind: string
  label: string
  /** 至少区分进行中与终态 */
  status: 'running' | 'done' | 'error'
}

export interface ChatToolRenderProps {
  toolCall: ChatToolCall
}

export interface ChatTransportRequest {
  /** 完整消息历史（内部模型，transport 自行转换为 wire 格式） */
  messages: ChatMessage[]
  systemPrompt?: string
  tools?: ChatTool[]
  /** 选中的模型 id（内置 OpenAI transport 按此路由 Provider） */
  model?: string
  /** 选中的推理等级（不透明字符串，由 Provider.applyReasoning 写入请求体） */
  reasoningLevel?: string
  signal: AbortSignal
}

/**
 * 一次模型请求的 token 用量。
 * 仅包含接口实际返回的字段；缓存类数字缺省为 undefined，不补 0。
 */
export interface ChatTokenUsage {
  promptTokens: number
  completionTokens: number
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

export interface ChatTransportHandlers {
  onTextDelta(delta: string): void
  onReasoningDelta?(delta: string): void
  /**
   * 一次完整的工具调用。
   * 流式参数片段由 transport 内部累积，参数完整后才通过该回调抛出。
   */
  onToolCall?(call: { id: string; name: string; arguments: string }): void
  /**
   * 本次请求的 token 用量（流式末包或非流式 usage）。
   * 接口未返回 usage 时不要调用，不要填 0 充数。
   */
  onUsage?(usage: ChatTokenUsage): void
  onError?(error: Error): void
}

/**
 * 对话传输层抽象。组件不关心具体的 LLM 协议，
 * 可传入内置的 createOpenAITransport()，也可自行实现接入任意后端。
 */
export type ChatTransport = (
  request: ChatTransportRequest,
  handlers: ChatTransportHandlers
) => Promise<void> | void
