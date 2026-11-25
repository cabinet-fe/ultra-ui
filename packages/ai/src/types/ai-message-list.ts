import type { DeconstructValue } from '@veltra/utils'
import type { Component } from 'vue'

import type { ChatMessage, ChatTool, ChatToolMeta } from '../chat/types'

export interface AiMessageListProps {
  /** 会话消息列表 */
  messages: ChatMessage[]
  /** 空闲时欢迎区快捷提问文案；字符串按单项处理 */
  welcome?: string | string[]
  /** 是否处于生成中状态 */
  running?: boolean
  /** 是否只读模式 */
  readonly?: boolean
  /** 是否展示空会话欢迎区 */
  showWelcome?: boolean
  /** 是否展示轮次导航指示器 */
  showNavigator?: boolean
  /** 工具定义或渲染元信息（支持数组或按名称索引的映射） */
  tools?: (ChatTool | ChatToolMeta)[] | Record<string, ChatTool | ChatToolMeta | undefined>
  /** 按工具名覆写图标 */
  toolIcons?: Record<string, Component>
  /** 透传给内部 MarkdownRender 的属性 */
  rendererProps?: Record<string, unknown>
}

export interface AiMessageListEmits {
  /** 响应指定工具调用的审批确认 */
  (e: 'respond', toolCallId: string, approved: boolean): void
  /** 点击重新生成最后一条回复 */
  (e: 'regenerate'): void
  /** 点击快捷提问条目 */
  (e: 'welcome-click', text: string): void
  /** 打开右侧侧边面板聚焦指定工具调用 */
  (e: 'open-panel', toolCallId: string): void
  /** 点击消息图片触发预览 */
  (e: 'preview-image', src: string, alt?: string): void
}

export interface _AiMessageListExposed {
  /** 滚动到列表最新位置（恢复吸底） */
  scrollToLatest: () => Promise<void>
  /** 跳转到指定轮次 key 对应的消息节点 */
  jumpToTurn: (key: string) => void
}

export type AiMessageListExposed = DeconstructValue<_AiMessageListExposed>
