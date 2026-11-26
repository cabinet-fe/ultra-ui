import { safeRun } from '@cat-kit/core'
import { computed, inject, toValue } from 'vue'
import type { Component, MaybeRefOrGetter } from 'vue'

import type { ChatTool, ChatToolCall, ChatToolMeta } from '../../chat/types'
import { AiChatDIKey } from './di'
import type { AiChatContext } from './di'
import { isSummarizedInHeader, summarizeArguments } from './tool-format'
import { FALLBACK_TOOL_ICON, resolveToolIcon } from './tool-icons'

/** 按 name 索引的工具定义或渲染元信息映射 */
export type ToolsMap = Record<string, ChatTool | ChatToolMeta | undefined>

/** 将数组或映射形态的 tools 归一化为按 name 索引的对象映射 */
export function normalizeToolsMap(
  tools?: (ChatTool | ChatToolMeta)[] | ToolsMap
): ToolsMap | undefined {
  if (!tools) return undefined
  if (!Array.isArray(tools)) return tools
  const map: ToolsMap = {}
  for (const item of tools) {
    map[item.name] = item
  }
  return map
}

/** 头部状态点配色：状态 → status class */
const STATUS_CLASS: Record<string, string> = {
  pending: 'is-active',
  running: 'is-active',
  'awaiting-confirm': 'is-warning',
  success: 'is-success',
  error: 'is-danger',
  rejected: 'is-danger'
}

/** 状态点 class（工具卡片 / 步骤行 / 侧面板头部共用） */
export function toolStatusClass(status: ChatToolCall['status']): string {
  return STATUS_CLASS[status] ?? ''
}

/** 终态判定（成功/失败/拒绝）：卡片折叠策略与耗时定格共用 */
export const isSettledStatus = (status: ChatToolCall['status']) =>
  status === 'success' || status === 'error' || status === 'rejected'

/** 参数串容错解析：解析失败退回原始串（brief 与展开判定的参数视图共用） */
const parseLooseArgs = (raw: string | undefined): unknown => {
  if (!raw) return undefined
  return safeRun(() => JSON.parse(raw) as unknown, raw)
}

/** 头部图标：meta.icon > 显式覆盖/宿主覆盖 > 内置名称规则 > 兜底（卡片 / 步骤行 / 侧面板共用） */
export function resolveToolHeaderIcon(
  call: ChatToolCall,
  tool: ChatTool | ChatToolMeta | undefined,
  toolIcons?: Record<string, Component>,
  di?: AiChatContext
): Component {
  return tool?.icon ?? resolveToolIcon(call.name, toolIcons ?? di?.toolIcons?.value)
}

export interface UseToolCallBriefOptions {
  tool?: MaybeRefOrGetter<ChatTool | ChatToolMeta | undefined>
  tools?: MaybeRefOrGetter<(ChatTool | ChatToolMeta)[] | ToolsMap | undefined>
  toolIcons?: MaybeRefOrGetter<Record<string, Component> | undefined>
}

/**
 * 工具调用头部摘要的共用视图模型：工具卡片与步骤行共用，
 * 避免图标 / 标题 / 摘要 / 耗时逻辑两处复制。
 * call 允许为 undefined（步骤行当前步是思考时无调用），此时各项取空值。
 * 支持无 AiChatDIKey 注入时通过 options 独立运行。
 */
export function useToolCallBrief(
  call: MaybeRefOrGetter<ChatToolCall | undefined>,
  options?: UseToolCallBriefOptions
) {
  const di = inject(AiChatDIKey, undefined)

  const current = computed(() => toValue(call))
  const toolsMap = computed(() => normalizeToolsMap(toValue(options?.tools)))

  /** 当前调用对应的工具定义或渲染元信息（显式 tool > 显式 tools > DI tools） */
  const tool = computed(() => {
    const c = current.value
    if (!c) return undefined
    return toValue(options?.tool) ?? toolsMap.value?.[c.name] ?? di?.tools?.value[c.name]
  })

  const resolvedToolIcons = computed(() => toValue(options?.toolIcons) ?? di?.toolIcons?.value)

  /** 进行中（pending/running）：工具名带扫光效果 */
  const isActive = computed(() => {
    const status = current.value?.status
    return status === 'pending' || status === 'running'
  })

  const statusClass = computed(() => {
    const status = current.value?.status
    return status ? toolStatusClass(status) : ''
  })

  /** 头部图标：meta.icon > 显式/宿主覆盖 > 内置名称规则 > 兜底；状态点走 status class */
  const headerIcon = computed(() => {
    const c = current.value
    return c
      ? resolveToolHeaderIcon(c, tool.value, resolvedToolIcons.value, di)
      : FALLBACK_TOOL_ICON
  })

  /** 头部标题：工具显示名，缺省取工具名（技术标识原样展示，便于对日志） */
  const toolTitle = computed(() => tool.value?.label ?? current.value?.name ?? '')

  const parsedArguments = computed(() => parseLooseArgs(current.value?.arguments))

  /** 折叠态摘要：取最能说明「这次调用了什么」的参数值 */
  const summary = computed(() => summarizeArguments(parsedArguments.value))

  return { tool, isActive, statusClass, headerIcon, toolTitle, parsedArguments, summary }
}

/** 展开态 body 是否有内容：自定义渲染 / 参数未被头部摘要覆盖 / 非空结果 / 有视图 */
export function cardHasBody(
  call: ChatToolCall,
  tool: ChatTool | ChatToolMeta | undefined,
  options?: { hasCustomSlot?: boolean; di?: AiChatContext }
): boolean {
  // 面板工具的卡片 body 恒为「查看面板」入口；reply 工具的自定义渲染在回复流，
  // 卡片 body 只看默认参数/结果视图（展开列表用于回溯过程，不重复渲染卡片）
  const customSlot = options?.hasCustomSlot ?? !!options?.di?.slots?.[`tool-${call.name}`]
  const customInCard = tool?.renderTo !== 'reply' && !!(tool?.render || customSlot)
  if (tool?.renderTo === 'panel' || customInCard) return true
  if (call.arguments && !isSummarizedInHeader(call.arguments)) return true
  const resultRaw = call.error ?? call.result
  if (resultRaw != null && resultRaw.trim() !== '') return true
  return call.view != null
}

/**
 * 进行中的工具调用是否需要用户交互/展示（工具卡片 / 步骤行列表的自动展开条件）：
 * 待确认（卡片默认要求 body 有内容可看）、有内联自定义 body（提问表单等）。
 * options.expandOnConfirm 为 true 时（步骤行）待确认一律视为需要交互——确认按钮在
 * 列表内卡片头上，收起即不可达，这是刻意的语义。
 */
export function toolNeedsInteraction(
  call: ChatToolCall,
  options?: {
    tool?: ChatTool | ChatToolMeta
    hasCustomSlot?: boolean
    di?: AiChatContext
    expandOnConfirm?: boolean
  }
): boolean {
  const tool = options?.tool ?? options?.di?.tools?.value[call.name]
  const customSlot = options?.hasCustomSlot ?? !!options?.di?.slots?.[`tool-${call.name}`]
  if (call.status === 'awaiting-confirm') {
    if (options?.expandOnConfirm) return true
    return cardHasBody(call, tool, { hasCustomSlot: customSlot, di: options?.di })
  }
  if (call.status !== 'pending' && call.status !== 'running') return false
  // panel / reply 工具的自定义渲染都不在卡片 body 内，不构成「内联可见」的展开理由
  const external = tool?.renderTo === 'panel' || tool?.renderTo === 'reply'
  const hasInlineBody = !external && !!(tool?.render || customSlot)
  return hasInlineBody
}
