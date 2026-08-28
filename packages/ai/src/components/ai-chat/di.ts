import type { BEM } from '@veltra/utils'
import type { Component, ComputedRef, InjectionKey, Slots } from 'vue'

import type { ChatTool, ChatToolMeta } from '../../chat/types'

export interface AiChatContext {
  /** ai-chat 组件的 BEM 类生成器 */
  cls: BEM<'ai-chat'>
  /** ai-chat 使用方提供的插槽（用于 tool-<name> 动态插槽） */
  slots: Slots
  /** 按 name 索引的工具定义或渲染元信息（解析 icon/label/render/autoCollapse） */
  tools: ComputedRef<Record<string, ChatTool | ChatToolMeta | undefined>>
  /** 宿主覆盖的 toolName → icon；缺省走包内名称规则 */
  toolIcons: ComputedRef<Record<string, Component> | undefined>
  /** 打开右侧面板并聚焦到指定工具调用（renderTo: 'panel' 工具的「查看面板」入口） */
  openPanel: (toolCallId: string) => void
}

export const AiChatDIKey: InjectionKey<AiChatContext> = Symbol('AiChatDIKey')
