import type { ChatTokenUsage } from '../chat/types'

export interface AiContextUsageProps {
  /** 会话累计 token 用量 */
  usage?: ChatTokenUsage | null
  /** 最近一次单次请求的 token 用量 */
  lastRequestUsage?: ChatTokenUsage | null
  /** 当前模型的上下文窗口上限（token） */
  contextWindow?: number
  /** 是否展示缓存命中 / 未命中等明细项 */
  detail?: boolean
  /** 明细面板弹出方向 */
  direction?: 'top' | 'bottom' | 'left' | 'right'
  /** 明细面板对齐方式 */
  alignment?: 'center' | 'start' | 'end'
}
