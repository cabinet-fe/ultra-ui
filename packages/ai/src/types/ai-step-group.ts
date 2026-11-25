import type { Component } from 'vue'

import type { ChatMessage, ChatTool, ChatToolCall, ChatToolMeta } from '../chat/types'

/** 步骤项：一次思考过程或一次工具调用 */
export interface AiStepItem {
  /** 唯一 key */
  key: string
  /** 步骤类型 */
  kind: 'reasoning' | 'tool'
  /** 所属消息 */
  message: ChatMessage
  /** kind 为 'tool' 时的工具调用对象 */
  toolCall?: ChatToolCall
}

/** 兼容旧内部命名 TurnStep */
export type TurnStep = AiStepItem

export interface AiStepGroupProps {
  /** 本段全部步骤列表 */
  steps: AiStepItem[]
  /** 是否流式进行中 */
  live?: boolean
  /** 段末终态（用于异常状态摘要着色） */
  endStatus?: 'error' | 'aborted'
  /** 工具定义或渲染元信息（支持数组或按名称索引的映射） */
  tools?: (ChatTool | ChatToolMeta)[] | Record<string, ChatTool | ChatToolMeta | undefined>
  /** 按工具名覆写图标 */
  toolIcons?: Record<string, Component>
  /** 是否默认展开步骤列表 */
  defaultExpanded?: boolean
}

export interface AiStepGroupEmits {
  /** 响应指定工具调用的审批确认 */
  (e: 'respond', toolCallId: string, approved: boolean): void
  /** 打开右侧侧边面板聚焦指定工具调用 */
  (e: 'open-panel', toolCallId: string): void
}
