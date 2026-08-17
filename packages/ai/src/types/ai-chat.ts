import type { DeconstructValue } from '@veltra/utils'
import type { Ref } from 'vue'

import type {
  ChatAttachment,
  ChatMessage,
  ChatQueuedMessage,
  ChatTool,
  ChatToolCall,
  ChatTransport
} from '../chat/types'
import type { ChatModelOption } from '../providers'

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
