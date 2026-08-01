import type { DeconstructValue } from '@veltra/utils'
import type { Ref } from 'vue'

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
  /** 工具实现，返回值（或 Promise 返回值）会被 JSON 序列化后回灌给模型 */
  execute: (args: A, ctx: ChatToolContext) => unknown
}

/** transport 请求参数 */
export interface ChatTransportRequest {
  /** 完整消息历史（内部模型，transport 自行转换为 wire 格式） */
  messages: ChatMessage[]
  /** 系统提示词 */
  systemPrompt?: string
  /** 可用工具 */
  tools?: ChatTool[]
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

export interface AiChatProps {
  /** 传输层（必填），可使用导出的 createOpenAITransport() 创建 */
  transport: ChatTransport
  /** 工具定义列表，不同场景传入不同工具赋予助手不同能力 */
  tools?: ChatTool[]
  /** 系统提示词 */
  systemPrompt?: string
  /** 消息列表，支持 v-model:messages 受控 */
  messages?: ChatMessage[]
  /** 空状态欢迎语 */
  welcome?: string
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
  /** 用户发送消息 */
  (e: 'send', message: ChatMessage): void
  /** 一轮对话完成（无更多工具调用） */
  (e: 'finish', message: ChatMessage): void
  /** 对话出错 */
  (e: 'error', error: Error): void
  /** 模型发起工具调用 */
  (e: 'tool-call', toolCall: ChatToolCall): void
}

export interface _AiChatExposed {
  /** 发送一条用户消息 */
  send: (content: string, attachments?: ChatAttachment[]) => void
  /** 中断当前生成 */
  abort: () => void
  /** 重新生成最后一条 assistant 回复 */
  regenerate: () => void
  /** 清空消息 */
  clear: () => void
}

export type AiChatExposed = DeconstructValue<_AiChatExposed>

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
  /** 是否正在生成中（含工具执行与多轮循环） */
  running: Ref<boolean>
  /** 发送一条用户消息并启动对话循环 */
  send: (content: string, attachments?: ChatAttachment[]) => void
  /** 中断当前生成，挂起的工具确认按拒绝处理 */
  abort: () => void
  /** 重新生成：移除最后一条用户消息之后的所有消息，重新跑对话循环 */
  regenerate: () => void
  /** 清空消息，生成中则先中断 */
  clear: () => void
  /** 响应 needsConfirm 工具的用户确认 */
  respondToolCall: (toolCallId: string, approved: boolean) => void
}
