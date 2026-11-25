import type { Component } from 'vue'

import type { ChatTool, ChatToolCall, ChatToolMeta } from '../chat/types'

export interface AiToolCallProps {
  /** 工具调用记录 */
  toolCall: ChatToolCall
  /** 工具定义或渲染元信息 */
  tool?: ChatTool | ChatToolMeta
  /** 按工具名覆写图标 */
  toolIcons?: Record<string, Component>
  /** 是否默认展开 */
  defaultExpanded?: boolean
}

export interface AiToolCallEmits {
  /** 响应待确认的工具调用 */
  (e: 'respond', approved: boolean): void
  /** 打开右侧侧边面板聚焦该工具调用 */
  (e: 'open-panel', toolCallId: string): void
}
