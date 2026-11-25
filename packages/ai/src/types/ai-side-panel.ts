import type { DeconstructValue } from '@veltra/utils'
import type { Component, Ref } from 'vue'

import type { ChatTool, ChatToolCall, ChatToolMeta } from '../chat/types'

export interface AiSidePanelProps {
  /** 当前聚焦的工具调用 */
  toolCall?: ChatToolCall
  /** 对应的工具定义或渲染元信息 */
  tool?: ChatTool | ChatToolMeta
  /** 按工具名覆写图标 */
  toolIcons?: Record<string, Component>
  /** 自定义面板标题（优先级高于 tool.panelTitle） */
  title?: string
  /** 自定义面板图标（优先级高于 tool.icon / toolIcons） */
  icon?: Component
  /** 是否全屏展示，支持 v-model:fullscreen */
  fullscreen?: boolean
  /** 是否显示刷新按钮 */
  refreshable?: boolean
  /** 是否显示全屏切换按钮 */
  fullscreenable?: boolean
  /** 是否显示关闭按钮 */
  closable?: boolean
}

export interface AiSidePanelEmits {
  (e: 'update:fullscreen', fullscreen: boolean): void
  /** 点击刷新按钮时触发 */
  (e: 'refresh'): void
  /** 点击关闭按钮时触发 */
  (e: 'close'): void
}

export interface _AiSidePanelExposed {
  /** 当前全屏状态 */
  fullscreen: Ref<boolean>
  /** 触发面板内容刷新（重建内部渲染实例） */
  refresh: () => void
}

export type AiSidePanelExposed = DeconstructValue<_AiSidePanelExposed>
