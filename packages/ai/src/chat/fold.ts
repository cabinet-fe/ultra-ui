import type { AskQuestionItem } from '../tools'
import type { ChatSessionEvent } from './session'
import type { ChatJob, ChatMessage, ChatQueuedMessage, ChatTokenUsage, ChatToolCall } from './types'

function eventSeq(event: ChatSessionEvent): number | undefined {
  return 'seq' in event ? event.seq : undefined
}

export interface ChatPendingApproval {
  approvalId: string
  toolName: string
  callId?: string
  reason?: string
  rpcId: string
}

/** 历史回放与实时 onEvent 共用的折叠状态 */
export interface ChatFoldState {
  lastSeq: number | null
  messages: ChatMessage[]
  queue: ChatQueuedMessage[]
  jobs: ChatJob[]
  tokenUsage: ChatTokenUsage | null
  projections: Record<string, unknown>
  title: string | null
  running: boolean
  pendingApprovals: ChatPendingApproval[]
  pendingQuestion: { questions: AskQuestionItem[]; rpcId: string } | null
  error: { code: string; message: string } | null
}

export function createFoldState(): ChatFoldState {
  return {
    lastSeq: null,
    messages: [],
    queue: [],
    jobs: [],
    tokenUsage: null,
    projections: {},
    title: null,
    running: false,
    pendingApprovals: [],
    pendingQuestion: null,
    error: null
  }
}

function mergeOptionalCount(a?: number, b?: number): number | undefined {
  if (a == null && b == null) return undefined
  return (a ?? 0) + (b ?? 0)
}

function addTokenUsage(a: ChatTokenUsage, b: ChatTokenUsage): ChatTokenUsage {
  const usage: ChatTokenUsage = {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    totalTokens: a.totalTokens + b.totalTokens
  }
  const cacheHitTokens = mergeOptionalCount(a.cacheHitTokens, b.cacheHitTokens)
  if (cacheHitTokens != null) usage.cacheHitTokens = cacheHitTokens
  const cacheMissTokens = mergeOptionalCount(a.cacheMissTokens, b.cacheMissTokens)
  if (cacheMissTokens != null) usage.cacheMissTokens = cacheMissTokens
  const cacheCreationTokens = mergeOptionalCount(a.cacheCreationTokens, b.cacheCreationTokens)
  if (cacheCreationTokens != null) usage.cacheCreationTokens = cacheCreationTokens
  return usage
}

function isTokenUsage(value: unknown): value is ChatTokenUsage {
  if (value == null || typeof value !== 'object') return false
  const usage = value as ChatTokenUsage
  return (
    typeof usage.promptTokens === 'number' &&
    typeof usage.completionTokens === 'number' &&
    typeof usage.totalTokens === 'number'
  )
}

function replaceAt<T>(list: T[], idx: number, item: T): T[] {
  const next = list.slice()
  next[idx] = item
  return next
}

function patchMessage(
  messages: ChatMessage[],
  id: string,
  patch: Partial<ChatMessage>
): ChatMessage[] {
  const idx = messages.findIndex((m) => m.id === id)
  if (idx < 0) {
    return [...messages, { id, role: 'assistant', content: '', status: 'streaming', ...patch }]
  }
  return replaceAt(messages, idx, { ...messages[idx]!, ...patch })
}

function appendToolCall(messages: ChatMessage[], call: ChatToolCall): ChatMessage[] {
  const idx = messages.findLastIndex((m) => m.role === 'assistant')
  if (idx < 0) {
    return [
      ...messages,
      {
        id: `tool-host:${call.id}`,
        role: 'assistant',
        content: '',
        status: 'streaming',
        toolCalls: [call]
      }
    ]
  }
  const target = messages[idx]!
  return replaceAt(messages, idx, { ...target, toolCalls: [...(target.toolCalls ?? []), call] })
}

function updateToolCall(
  messages: ChatMessage[],
  callId: string,
  patch: Partial<ChatToolCall>
): ChatMessage[] {
  const idx = messages.findIndex((m) => m.toolCalls?.some((c) => c.id === callId))
  if (idx < 0) return messages
  const msg = messages[idx]!
  const calls = (msg.toolCalls ?? []).slice()
  const callIdx = calls.findIndex((c) => c.id === callId)
  if (callIdx < 0) return messages
  calls[callIdx] = { ...calls[callIdx]!, ...patch }
  return replaceAt(messages, idx, { ...msg, toolCalls: calls })
}

/**
 * 纯函数 fold：历史回放与实时 onEvent 走同一套。
 * 后到的更小/重复 seq 不覆盖已应用事件。
 */
export function foldSessionEvent(state: ChatFoldState, event: ChatSessionEvent): ChatFoldState {
  const seq = eventSeq(event)
  if (seq != null && state.lastSeq != null && seq <= state.lastSeq) return state

  const next: ChatFoldState = {
    ...state,
    lastSeq: seq ?? state.lastSeq,
    projections: { ...state.projections }
  }

  switch (event.type) {
    case 'user/message': {
      if (next.messages.some((m) => m.id === event.messageId)) break
      const userMessage: ChatMessage = { id: event.messageId, role: 'user', content: event.content }
      if (event.attachments) userMessage.attachments = event.attachments
      next.messages = [...next.messages, userMessage]
      break
    }
    case 'assistant/chunk': {
      const current = next.messages.find((m) => m.id === event.messageId)
      next.messages = patchMessage(next.messages, event.messageId, {
        role: 'assistant',
        status: 'streaming',
        content: (current?.content ?? '') + event.delta,
        reasoning: event.reasoningDelta
          ? (current?.reasoning ?? '') + event.reasoningDelta
          : current?.reasoning
      })
      break
    }
    case 'assistant/message': {
      next.messages = patchMessage(next.messages, event.messageId, {
        role: 'assistant',
        status: 'done',
        content: event.content,
        reasoning: event.reasoning,
        toolCalls: event.toolCalls ?? next.messages.find((m) => m.id === event.messageId)?.toolCalls
      })
      break
    }
    case 'tool/call': {
      const call: ChatToolCall = {
        id: event.callId,
        name: event.name,
        arguments: event.arguments,
        status: 'pending'
      }
      if (event.view !== undefined) call.view = event.view
      next.messages = appendToolCall(next.messages, call)
      break
    }
    case 'tool/result': {
      const patch: Partial<ChatToolCall> = { status: event.status }
      if (event.result !== undefined) patch.result = event.result
      if (event.error !== undefined) patch.error = event.error
      if (event.view !== undefined) patch.view = event.view
      next.messages = updateToolCall(next.messages, event.callId, patch)
      break
    }
    case 'queue/snapshot': {
      next.queue = event.items.slice()
      break
    }
    case 'jobs/snapshot': {
      next.jobs = event.jobs.slice()
      break
    }
    case 'projection': {
      if (event.key === 'tokenUsage' && isTokenUsage(event.value)) {
        next.tokenUsage = next.tokenUsage
          ? addTokenUsage(next.tokenUsage, event.value)
          : event.value
      } else if (event.key === 'title' && typeof event.value === 'string') {
        next.title = event.value
      } else {
        next.projections[event.key] = event.value
      }
      break
    }
    case 'running': {
      next.running = event.running
      break
    }
    case 'finish': {
      next.running = false
      break
    }
    case 'error': {
      next.running = false
      next.error = { code: event.code, message: event.message }
      break
    }
    case 'approval/requested': {
      if (event.callId) {
        next.messages = updateToolCall(next.messages, event.callId, { status: 'awaiting-confirm' })
      }
      next.pendingApprovals = [
        ...next.pendingApprovals,
        {
          approvalId: event.approvalId,
          toolName: event.toolName,
          callId: event.callId,
          reason: event.reason,
          rpcId: event.rpcId
        }
      ]
      break
    }
    case 'approval/resolved': {
      const hit = next.pendingApprovals.find((a) => a.approvalId === event.approvalId)
      next.pendingApprovals = next.pendingApprovals.filter((a) => a.approvalId !== event.approvalId)
      if (hit?.callId && event.outcome === 'rejected') {
        next.messages = updateToolCall(next.messages, hit.callId, { status: 'rejected' })
      }
      break
    }
    case 'question/requested': {
      next.pendingQuestion = { questions: event.questions, rpcId: event.rpcId }
      break
    }
    case 'question/resolved': {
      if (next.pendingQuestion?.rpcId === event.questionRpcId) next.pendingQuestion = null
      break
    }
  }

  return next
}
