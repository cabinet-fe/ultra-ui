import { computed, inject, toValue } from 'vue'
import type { Component, MaybeRefOrGetter } from 'vue'

import type { ChatTool, ChatToolCall, ChatToolMeta } from '../../chat/types'
import { AiChatDIKey } from './di'
import type { AiChatContext } from './di'
import {
  dropEchoedFields,
  isSummarizedInHeader,
  summarizeArguments,
  toToolNode,
  unwrapSingleValue
} from './tool-format'
import { FALLBACK_TOOL_ICON, resolveToolIcon } from './tool-icons'

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

/** 任意原始串 → 展示节点；空串 / 解析失败时退回纯文本节点，不得 throw（卡片视图管线共用） */
export const nodeOf = (raw: string | undefined) => (raw ? toToolNode(raw) : undefined)

/** 头部图标：meta.icon > 宿主覆盖 > 内置名称规则 > 兜底（卡片 / 步骤行 / 侧面板共用） */
export function resolveToolHeaderIcon(
  call: ChatToolCall,
  tool: ChatTool | ChatToolMeta | undefined,
  di?: AiChatContext
): Component {
  return tool?.icon ?? resolveToolIcon(call.name, di?.toolIcons?.value)
}

/**
 * 工具调用头部摘要的共用视图模型：工具卡片与步骤行共用，
 * 避免图标 / 标题 / 摘要 / 耗时逻辑两处复制。
 * call 允许为 undefined（步骤行当前步是思考时无调用），此时各项取空值。
 */
export function useToolCallBrief(call: MaybeRefOrGetter<ChatToolCall | undefined>) {
  const di = inject(AiChatDIKey)

  const current = computed(() => toValue(call))

  /** 当前调用对应的工具定义或渲染元信息（session 下忽略 execute / needsConfirm / terminal） */
  const tool = computed(() => {
    const c = current.value
    return c ? di?.tools.value[c.name] : undefined
  })

  /** 进行中（pending/running）：工具名带扫光效果 */
  const isActive = computed(() => {
    const status = current.value?.status
    return status === 'pending' || status === 'running'
  })

  const statusClass = computed(() => {
    const status = current.value?.status
    return status ? toolStatusClass(status) : ''
  })

  /** 头部图标：meta.icon > 宿主覆盖 > 内置名称规则 > 兜底；状态点走 status class */
  const headerIcon = computed(() => {
    const c = current.value
    return c ? resolveToolHeaderIcon(c, tool.value, di) : FALLBACK_TOOL_ICON
  })

  /** 头部标题：工具显示名，缺省取工具名（技术标识原样展示，便于对日志） */
  const toolTitle = computed(() => tool.value?.label ?? current.value?.name ?? '')

  const parsedArguments = computed<unknown>(() => {
    const raw = current.value?.arguments
    if (!raw) return undefined
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  })

  /** 折叠态摘要：取最能说明「这次调用了什么」的参数值 */
  const summary = computed(() => summarizeArguments(parsedArguments.value))

  return { tool, isActive, statusClass, headerIcon, toolTitle, parsedArguments, summary }
}

/** 展开态 body 是否有内容：自定义渲染 / 参数未被头部摘要覆盖 / 结果非纯回显 / 有视图 */
function cardHasBody(
  call: ChatToolCall,
  tool: ChatTool | ChatToolMeta | undefined,
  di?: AiChatContext
): boolean {
  if (tool?.renderTo === 'panel' || tool?.render || di?.slots[`tool-${call.name}`]) return true
  const argumentNode = nodeOf(call.arguments)
  if (argumentNode && !isSummarizedInHeader(argumentNode)) return true
  const resultRaw = call.error ?? call.result
  if (resultRaw != null) {
    let parsedArgs: unknown
    try {
      parsedArgs = call.arguments ? JSON.parse(call.arguments) : undefined
    } catch {
      parsedArgs = call.arguments
    }
    const display = unwrapSingleValue(dropEchoedFields(toToolNode(resultRaw), parsedArgs))
    if (display != null && display.type !== 'empty') return true
  }
  return call.view != null
}

/**
 * 进行中的工具调用是否需要用户交互/展示（工具卡片 / 步骤行列表的自动展开条件）：
 * 待确认（卡片默认要求 body 有内容可看）、有内联自定义 body（提问表单等）。
 * opts.expandOnConfirm 为 true 时（步骤行）待确认一律视为需要交互——确认按钮在
 * 列表内卡片头上，收起即不可达，这是刻意的语义。
 */
export function toolNeedsInteraction(
  call: ChatToolCall,
  di?: AiChatContext,
  opts?: { expandOnConfirm?: boolean }
): boolean {
  const tool = di?.tools.value[call.name]
  if (call.status === 'awaiting-confirm') {
    return opts?.expandOnConfirm || cardHasBody(call, tool, di)
  }
  if (call.status !== 'pending' && call.status !== 'running') return false
  const isPanelTool = tool?.renderTo === 'panel'
  const hasInlineBody = !isPanelTool && !!(tool?.render || di?.slots[`tool-${call.name}`])
  return hasInlineBody
}
