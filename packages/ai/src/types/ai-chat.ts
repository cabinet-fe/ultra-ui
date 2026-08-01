import type { DeconstructValue } from '@veltra/utils'

import type {
  ChatAttachment,
  ChatMessage,
  ChatTool,
  ChatToolCall,
  ChatTransport
} from '../chat/types'

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
