import type { ChatQueuedMessage } from '../chat/types'

export interface AiMessageQueueProps {
  /** 待发送队列（按执行顺序排列） */
  queue: ChatQueuedMessage[]
  /** 只读模式，隐藏插队/编辑/移除操作 */
  readonly?: boolean
}

export interface AiMessageQueueEmits {
  /** 立即开始执行指定排队消息 */
  (e: 'start-now', id: string): void
  /** 取回编辑指定排队消息 */
  (e: 'edit', id: string): void
  /** 移除指定排队消息 */
  (e: 'remove', id: string): void
}
