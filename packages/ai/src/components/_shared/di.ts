import type { Component, ComputedRef, InjectionKey, Ref, ShallowRef, Slots } from 'vue'

import type { ChatPendingQuestion } from '../../chat/fold'
import type { ChatTool, ChatToolMeta } from '../../chat/types'
import type { AskQuestionAnswer, AskQuestionItem } from '../../tools'

export interface AiChatContext {
  /** 使用方提供的插槽（用于 tool-<name> 动态插槽） */
  slots?: Slots
  /** 按 name 索引的工具定义或渲染元信息（解析 icon/label/render/autoCollapse） */
  tools?: ComputedRef<Record<string, ChatTool | ChatToolMeta | undefined>>
  /** 宿主覆盖的 toolName → icon；缺省走包内名称规则 */
  toolIcons?: ComputedRef<Record<string, Component> | undefined>
  /** 打开右侧面板并聚焦到指定工具调用（renderTo: 'panel' 工具的「查看面板」入口） */
  openPanel?: (toolCallId: string) => void
  /** 打开图片全屏预览 */
  previewImage?: (src: string, alt?: string) => void
  /** 当前挂起的 session 提问（用于流内提问卡片关联待答问题） */
  pendingQuestion?: Ref<ChatPendingQuestion | null>
  /** 按 callId 索引的 session 关联提问列表（提问提交后仍留在流内展示） */
  questionCalls?: Ref<Record<string, AskQuestionItem[]>>
  /** 流内提交但尚未从 tool/result 拿到结构化结果的 session 提问答案缓存 */
  resolvedQuestionAnswers?: ShallowRef<Map<string, AskQuestionAnswer[]>>
  /** 流内提交 session 关联提问 */
  respondQuestion?: (rpcId: string, callId: string, answers: AskQuestionAnswer[]) => void
}

export const AiChatDIKey: InjectionKey<AiChatContext> = Symbol('AiChatDIKey')
