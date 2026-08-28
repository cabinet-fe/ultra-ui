import type { DeconstructValue } from '@veltra/utils'
import type { Component, Ref } from 'vue'

import type { ChatSessionTransport } from '../chat/session'
import type {
  ChatAttachment,
  ChatMessage,
  ChatQueuedMessage,
  ChatTokenUsage,
  ChatTool,
  ChatToolCall,
  ChatToolMeta,
  ChatTransport
} from '../chat/types'
import type { ChatModelOption } from '../providers'

export interface AiChatProps {
  /** 传输层（必填）；函数型 ChatTransport 或 session 对象，可使用 createOpenAITransport / createServerTransport */
  transport: ChatTransport | ChatSessionTransport
  /**
   * 工具列表。函数 transport 传入 ChatTool[]（必有 execute）；
   * session 下可为 ChatToolMeta[]（仅渲染元信息）。ChatTool[] 仍可赋值。
   */
  tools?: (ChatTool | ChatToolMeta)[]
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
  /** 空闲时输入框上方的快捷提问（点击即发送）；字符串按单项处理 */
  welcome?: string | string[]
  /** 输入框占位文本 */
  placeholder?: string
  /** 附件 accept 类型，默认 image/* */
  accept?: string
  /** 单个附件最大字节数，默认 10MB */
  maxAttachmentSize?: number
  /** 透传给内部 MarkdownRender 的属性 */
  rendererProps?: Record<string, unknown>
  /**
   * 是否展示 token 用量明细（缓存命中 / 未命中；缺字段不显示）。
   * 默认 false：仅在拿到 usage 时显示会话累计「总 token」。接口未返回 usage 时不展示。
   */
  tokenUsageDetail?: boolean
  /**
   * 覆盖包内 toolName → icon 映射（精确名优先于内置名称规则）。
   * 缺省不传则走内置表；未命中的名称仍用兜底图标，不得 throw。
   */
  toolIcons?: Record<string, Component>
  /** 只读：不展示输入区、欢迎语不可发送、队列无插队/编辑/移除。默认 false */
  readonly?: boolean
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
  /** 清空消息、待发送队列与 token 统计（生成中会先中止） */
  clear: () => void
  /** 当前会话累计 token（从未收到 usage 时为 null） */
  tokenUsage: Ref<ChatTokenUsage | null>
  /** 最近一轮用户对话的 token（含工具多轮请求；该轮无 usage 时为 null） */
  lastTurnUsage: Ref<ChatTokenUsage | null>
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
