import type { AskQuestionItem } from '../tools'
import type { ChatAttachment, ChatJob, ChatQueuedMessage, ChatToolCall } from './types'

/** 归一化后的服务端会话事件（协议无关） */
export type ChatSessionEvent =
  | {
      type: 'user/message'
      messageId: string
      seq: number
      content: string
      attachments?: ChatAttachment[]
    }
  | {
      type: 'assistant/chunk'
      messageId: string
      seq: number
      delta: string
      reasoningDelta?: string
    }
  | {
      type: 'assistant/message'
      messageId: string
      seq: number
      content: string
      reasoning?: string
      toolCalls?: ChatToolCall[]
    }
  | {
      type: 'tool/call'
      callId: string
      name: string
      arguments: string
      seq: number
      view?: unknown
    }
  | {
      type: 'tool/result'
      callId: string
      status: 'success' | 'error' | 'rejected'
      result?: string
      error?: string
      seq: number
      view?: unknown
    }
  | {
      type: 'approval/requested'
      approvalId: string
      toolName: string
      callId?: string
      reason?: string
      rpcId: string
    }
  | { type: 'approval/resolved'; approvalId: string; outcome: string }
  | { type: 'question/requested'; questions: AskQuestionItem[]; rpcId: string }
  | { type: 'question/resolved'; questionRpcId: string; outcome: 'answered' | 'cancelled' }
  | { type: 'queue/snapshot'; items: ChatQueuedMessage[] }
  | { type: 'jobs/snapshot'; jobs: ChatJob[] }
  | { type: 'projection'; key: string; value: unknown; seq: number }
  | { type: 'running'; running: boolean }
  | { type: 'finish' }
  | { type: 'error'; code: string; message: string }

/** 服务端会话 transport：对象形态，与函数型 ChatTransport 互斥 */
export interface ChatSessionTransport {
  readonly kind: 'session'
  open(handlers: { onEvent(event: ChatSessionEvent): void; onDisconnect?(): void }): () => void
  send(content: string, attachments?: ChatAttachment[]): Promise<void>
  cancel(): Promise<void>
  respond(rpcId: string, ok: boolean, value?: unknown): Promise<void>
  fetchHistory(beforeSeq?: number): Promise<{ events: ChatSessionEvent[]; hasMore: boolean }>
  selectModel(provider: string, model: string): Promise<void>
}

/**
 * 协议翻译层：订阅事件流、把动作打到远端、拉历史。
 * 时序校验 / dispose / 断线补拉 / in-flight 去重由 createServerTransport 完成。
 */
export interface ChatSessionAdapter {
  subscribe(handlers: { onEvent(event: ChatSessionEvent): void; onDisconnect?(): void }): () => void
  send(content: string, attachments?: ChatAttachment[]): Promise<void>
  cancel(): Promise<void>
  respond(rpcId: string, ok: boolean, value?: unknown): Promise<void>
  fetchHistory(beforeSeq?: number): Promise<{ events: ChatSessionEvent[]; hasMore: boolean }>
  selectModel(provider: string, model: string): Promise<void>
}

function eventSeq(event: ChatSessionEvent): number | undefined {
  return 'seq' in event ? event.seq : undefined
}

/** 仅带 kind: 'session' 的对象为 true；函数 / null / 无 kind 均为 false */
export function isServerTransport(t: unknown): t is ChatSessionTransport {
  return typeof t === 'object' && t !== null && (t as { kind?: unknown }).kind === 'session'
}

function runExclusive(gate: { busy: boolean }, action: () => Promise<void>): Promise<void> {
  if (gate.busy) return Promise.resolve()
  gate.busy = true
  return action().finally(() => {
    gate.busy = false
  })
}

/**
 * 用 adapter 包出 ChatSessionTransport。
 * 包内完成 seq 校验、disposer、断线补拉、动作 in-flight 去重。
 */
export function createServerTransport(adapter: ChatSessionAdapter): ChatSessionTransport {
  let lastSeq: number | undefined
  const sendGate = { busy: false }
  const cancelGate = { busy: false }
  const respondGate = { busy: false }
  const selectModelGate = { busy: false }

  const deliver = (event: ChatSessionEvent, onEvent: (e: ChatSessionEvent) => void) => {
    const seq = eventSeq(event)
    if (seq != null && lastSeq != null && seq <= lastSeq) {
      console.warn(`[ChatSessionTransport] 丢弃乱序事件 seq=${seq} lastSeq=${lastSeq}`)
      return
    }
    if (seq != null) lastSeq = seq
    onEvent(event)
  }

  return {
    kind: 'session',
    open(handlers) {
      let disposed = false
      const unsubscribe = adapter.subscribe({
        onEvent(event) {
          if (!disposed) deliver(event, handlers.onEvent)
        },
        onDisconnect() {
          if (disposed) return
          void adapter.fetchHistory(lastSeq).then(
            ({ events }) => {
              if (disposed) return
              for (const event of events) deliver(event, handlers.onEvent)
              handlers.onDisconnect?.()
            },
            () => {
              if (!disposed) handlers.onDisconnect?.()
            }
          )
        }
      })
      return () => {
        disposed = true
        unsubscribe()
      }
    },
    send(content, attachments) {
      return runExclusive(sendGate, () => adapter.send(content, attachments))
    },
    cancel() {
      return runExclusive(cancelGate, () => adapter.cancel())
    },
    respond(rpcId, ok, value) {
      return runExclusive(respondGate, () => adapter.respond(rpcId, ok, value))
    },
    fetchHistory(beforeSeq) {
      return adapter.fetchHistory(beforeSeq)
    },
    selectModel(provider, model) {
      return runExclusive(selectModelGate, () => adapter.selectModel(provider, model))
    }
  }
}
