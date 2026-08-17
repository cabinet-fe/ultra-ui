import type { DeconstructValue } from '@veltra/utils'
import type { Component, Ref } from 'vue'

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

/**
 * 创建 OpenAI 兼容协议的传输层（chat/completions SSE）。
 * 按 request.model 路由到对应 Provider；旧单字段配置已移除。
 */
export declare function createOpenAITransport(options: OpenAITransportOptions): OpenAITransport

export interface AiChatProps {
  /** 传输层（必填），可使用导出的 createOpenAITransport() 创建 */
  transport: ChatTransport
  /** 工具定义列表，不同场景传入不同工具赋予助手不同能力 */
  tools?: ChatTool[]
  /** 系统提示词 */
  systemPrompt?: string
  /**
   * 单次发送允许的最大生成轮次（一轮 = 一次模型生成 + 可能的工具执行），默认 10。
   * 模型持续调用工具不收敛时，达到上限即停止继续请求并发出 finish，防止失控循环。
   */
  maxToolRounds?: number
  /** 消息列表，支持 v-model:messages 受控 */
  messages?: ChatMessage[]
  /**
   * 可选模型列表；有值则在输入栏展示模型选择器。
   * 可从 createOpenAITransport() 返回值的 `.models` 直接传入。
   */
  models?: ChatModelOption[]
  /** 当前模型 id，支持 v-model:model */
  model?: string
  /** 当前推理等级，支持 v-model:reasoning-level */
  reasoningLevel?: string
  /** 空状态欢迎项（快捷提问，点击即发送）；字符串按单项处理 */
  welcome?: string | string[]
  /** 输入框占位文本 */
  placeholder?: string
  /** 附件 accept 类型，默认 image/* */
  accept?: string
  /** 单个附件最大字节数，默认 10MB */
  maxAttachmentSize?: number
  /** 透传给内部 MarkdownRender 的属性 */
  rendererProps?: Record<string, unknown>
}

export interface AiChatEmits {
  /** 消息列表变化 */
  (e: 'update:messages', messages: ChatMessage[]): void
  /** 当前模型变化 */
  (e: 'update:model', model: string | undefined): void
  /** 当前推理等级变化 */
  (e: 'update:reasoningLevel', reasoningLevel: string | undefined): void
  /** 用户发送消息 */
  (e: 'send', message: ChatMessage): void
  /** 一轮对话完成（无更多工具调用、命中 terminal 工具或达到 maxToolRounds 上限） */
  (e: 'finish', message: ChatMessage): void
  /** 对话出错 */
  (e: 'error', error: Error): void
  /** 模型发起工具调用 */
  (e: 'tool-call', toolCall: ChatToolCall): void
}

export interface _AiChatExposed {
  /** 发送一条用户消息（会话进行中时进入待发送队列） */
  send: (content: string, attachments?: ChatAttachment[]) => void
  /** 中断当前生成（保留待发送队列） */
  abort: () => void
  /** 重新生成最后一条 assistant 回复 */
  regenerate: () => void
  /** 清空消息与待发送队列 */
  clear: () => void
  /** 待发送消息队列（会话进行中提交的消息按序排队，收尾后 FIFO 自动接续） */
  queue: Ref<ChatQueuedMessage[]>
  /** 立即执行队列中的某条：中断当前会话并插队为下一条 */
  startQueued: (id: string) => void
  /** 从队列移除某条（返回被移除项） */
  removeQueued: (id: string) => ChatQueuedMessage | undefined
  /** 向队列插入一条消息（beforeId 插到某条之前，缺省追加尾部；空闲时自动消耗队首） */
  enqueue: (content: string, attachments?: ChatAttachment[], beforeId?: string) => ChatQueuedMessage
}

export type AiChatExposed = DeconstructValue<_AiChatExposed>

/** 活体球生命状态：驱动常态动画（平静 / 思考 / 输出） */
export type AiOrbStatus = 'idle' | 'thinking' | 'speaking'

/**
 * 瞬时表情：播放约 1-2s 后自动回到 status 驱动的常态。
 * - happy：成功 / 回答完毕 —— 先睁大眼睛，再弯眼大笑 + 点头
 * - shock：惊讶 —— 睁大眼睛 + 小嘴微张 + 轻微后仰
 * - frustrated：受挫（如工具调用失败）—— 闭紧眼睛 + 摇头 + 嘴角下撇
 */
export type AiOrbReaction = 'happy' | 'shock' | 'frustrated'

export interface AiOrbProps {
  /** 球体直径（px），默认 48 */
  size?: number
  /** 生命状态，默认 idle */
  status?: AiOrbStatus
}

export interface AiOrbEmits {
  /** 点击球体（球体同时会做 Q 弹反馈） */
  (e: 'click'): void
}

export interface AiOrbExposed {
  /** 播放一次瞬时表情（对应阶段性事件，如回答完毕 / 工具调用失败） */
  react: (reaction: AiOrbReaction) => void
}

/** useChat 入参（与 UAiChat 共用 props / emits 契约） */
export interface UseChatOptions {
  props: AiChatProps
  emit: AiChatEmits
}

/**
 * AI 对话核心状态机：消息管理、流式追加、工具调用循环编排。
 * 与 UI 解耦，UAiChat 内部即基于它实现；无头场景可直接使用。
 */
export declare function useChat(options: UseChatOptions): {
  /** 消息列表（本地受控，随 props.messages 同步） */
  messages: Ref<ChatMessage[]>
  /** 当前模型 id */
  model: Ref<string | undefined>
  /** 当前推理等级 */
  reasoningLevel: Ref<string | undefined>
  /** 是否正在生成中（含工具执行与多轮循环） */
  running: Ref<boolean>
  /** 待发送队列（会话进行中提交的消息按序排队，收尾后 FIFO 自动接续） */
  queue: Ref<ChatQueuedMessage[]>
  /** 发送一条用户消息（会话进行中时进入待发送队列） */
  send: (content: string, attachments?: ChatAttachment[]) => void
  /** 中断当前生成，挂起的工具确认按拒绝处理（保留待发送队列） */
  abort: () => void
  /** 重新生成：移除最后一条用户消息之后的所有消息，重新跑对话循环 */
  regenerate: () => void
  /** 清空消息与待发送队列，生成中则先中断 */
  clear: () => void
  /** 响应 needsConfirm 工具的用户确认 */
  respondToolCall: (toolCallId: string, approved: boolean) => void
  /** 向队列插入一条消息（beforeId 插到某条之前，缺省追加尾部；空闲时自动消耗队首） */
  enqueue: (content: string, attachments?: ChatAttachment[], beforeId?: string) => ChatQueuedMessage
  /** 立即执行队列中的某条：中断当前会话并插队为下一条 */
  startQueued: (id: string) => void
  /** 从队列移除某条（返回被移除项） */
  removeQueued: (id: string) => ChatQueuedMessage | undefined
}

/** 单个提问项（内置 askQuestion 工具的模型输出） */
export interface AskQuestionItem {
  /** 问题文案 */
  question: string
  /** 预设选项（单选）；缺省为纯文本题 */
  options?: string[]
  /** 自定义输入占位文案 */
  placeholder?: string
}

/** 一条问答结果 */
export interface AskQuestionAnswer {
  /** 问题文案 */
  question: string
  /** 用户回答（选中的选项或自定义输入） */
  answer: string
}

/** 提问工具参数（模型输出） */
export interface AskQuestionArgs {
  questions: AskQuestionItem[]
}

/** 提问工具结果（序列化后回灌模型，渲染层据此展示问答摘要） */
export interface AskQuestionResult {
  answers: AskQuestionAnswer[]
}
