import type { ChatMessage, ChatToolCall } from '../../chat/types'

/** 一步：一次思考或一次工具调用（消息列表按段编排后交给步骤行展示） */
export interface TurnStep {
  /** reasoning: `${msg.id}:reasoning`；tool: call.id */
  key: string
  kind: 'reasoning' | 'tool'
  /** 来源消息 */
  message: ChatMessage
  /** kind === 'tool' 时的调用 */
  toolCall?: ChatToolCall
}
