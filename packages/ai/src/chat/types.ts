import type { Component } from 'vue'

/** 聊天附件（首版仅支持图片） */
export interface ChatAttachment {
  /** 文件名 */
  name: string
  /** MIME 类型 */
  mimeType: string
  /** 字节大小 */
  size: number
  /** base64 data URL */
  dataUrl: string
}

/** 工具调用状态 */
export type ToolCallStatus =
  | 'pending'
  | 'awaiting-confirm'
  | 'running'
  | 'success'
  | 'error'
  | 'rejected'

/** 一次工具调用 */
export interface ChatToolCall {
  /** 调用 id（由模型生成） */
  id: string
  /** 工具名 */
  name: string
  /** 模型输出的原始 JSON 参数串 */
  arguments: string
  /** 调用状态 */
  status: ToolCallStatus
  /** 序列化后的工具执行结果 */
  result?: string
  /** 执行失败信息 */
  error?: string
}

/** 聊天消息 */
export interface ChatMessage {
  /** 消息 id */
  id: string
  /** 角色 */
  role: 'user' | 'assistant' | 'tool'
  /** markdown 内容 */
  content: string
  /** 思考过程（reasoning） */
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
  /** 队列项 id */
  id: string
  /** 消息内容 */
  content: string
  /** 携带的附件 */
  attachments?: ChatAttachment[]
}

/** 工具执行上下文 */
export interface ChatToolContext {
  /** 本次工具调用 */
  toolCall: ChatToolCall
  /** 中断信号（用户点击停止时触发） */
  signal: AbortSignal
}

/**
 * 对话工具定义。
 * 在不同场景传入不同的工具数组，即可赋予对话助手不同的能力。
 */
export interface ChatTool<A = any> {
  /** 工具名（传给模型，需唯一） */
  name: string
  /** 工具描述（传给模型） */
  description: string
  /** 参数 JSON Schema（原样传给模型） */
  parameters: Record<string, unknown>
  /** 执行前是否需要用户在 UI 中确认 */
  needsConfirm?: boolean
  /** 工具图标组件，缺省用内置状态图标（状态颜色/加载旋转仍作用于图标容器） */
  icon?: Component
  /** 工具显示名，缺省取 name */
  label?: string
  /**
   * 自定义工具卡片内容渲染（组件或渲染函数），props 为 ChatToolRenderProps。
   * 设置后替换卡片 body 的默认参数/结果展示；优先级高于 tool-<name> 插槽。
   * renderTo 为 'panel' 时改为在右侧侧边面板中渲染。
   */
  render?: Component
  /**
   * 渲染位置。缺省 'inline'：render 组件展示在会话内的工具卡片中；
   * 'panel'：render 组件展示在对话区右侧的侧边面板（新调用自动打开面板，
   * 工具卡片内仅保留「查看面板」入口，面板与会话区宽度可拖拽调节）。
   * 适合打开后台页面、表单、图表、列表等需要较大交互区域的工具。
   */
  renderTo?: 'inline' | 'panel'
  /**
   * 侧边面板默认宽度（px，最小 320），仅 renderTo: 'panel' 时生效。
   * 聚焦到该工具的调用时应用；缺省时面板打开取「容器宽 - 860」（即默认尽可能大，
   * 给会话区保留 860px）；面板已打开时切换聚焦保持当前宽度（含用户拖拽结果）。
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

/** 工具自定义渲染组件 / 渲染函数的 props */
export interface ChatToolRenderProps {
  /** 本次工具调用（含 status/arguments/result/error，可自行渲染进度与错误） */
  toolCall: ChatToolCall
}

/** transport 请求参数 */
export interface ChatTransportRequest {
  /** 完整消息历史（内部模型，transport 自行转换为 wire 格式） */
  messages: ChatMessage[]
  /** 系统提示词 */
  systemPrompt?: string
  /** 可用工具 */
  tools?: ChatTool[]
  /** 选中的模型 id（内置 OpenAI transport 按此路由 Provider） */
  model?: string
  /** 选中的推理等级（不透明字符串，由 Provider.applyReasoning 写入请求体） */
  reasoningLevel?: string
  /** 中断信号 */
  signal: AbortSignal
}

/** transport 流式事件回调 */
export interface ChatTransportHandlers {
  /** 文本增量 */
  onTextDelta(delta: string): void
  /** 思考内容增量 */
  onReasoningDelta?(delta: string): void
  /**
   * 一次完整的工具调用。
   * 流式参数片段由 transport 内部累积，参数完整后才通过该回调抛出。
   */
  onToolCall?(call: { id: string; name: string; arguments: string }): void
  /** 请求错误 */
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
