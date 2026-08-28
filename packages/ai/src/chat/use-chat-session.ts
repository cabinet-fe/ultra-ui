import type { Ref } from 'vue'

import type { AskQuestionItem } from '../tools'
import {
  createFoldState,
  foldSessionEvent,
  type ChatFoldState,
  type ChatPendingApproval
} from './fold'
import type { ChatSessionEvent, ChatSessionTransport } from './session'
import type { ChatJob, ChatMessage, ChatQueuedMessage, ChatTokenUsage } from './types'

export interface SessionChatSurface {
  messages: Ref<ChatMessage[]>
  queue: Ref<ChatQueuedMessage[]>
  jobs: Ref<ChatJob[]>
  tokenUsage: Ref<ChatTokenUsage | null>
  projections: Ref<Record<string, unknown>>
  title: Ref<string | null>
  running: Ref<boolean>
  pendingApprovals: Ref<ChatPendingApproval[]>
  pendingQuestion: Ref<{ questions: AskQuestionItem[]; rpcId: string } | null>
}

/** 把 fold 状态同步到 useChat 的渲染面 */
function syncFold(fold: ChatFoldState, surface: SessionChatSurface) {
  surface.messages.value = fold.messages
  surface.queue.value = fold.queue
  surface.jobs.value = fold.jobs
  surface.tokenUsage.value = fold.tokenUsage
  surface.projections.value = fold.projections
  surface.title.value = fold.title
  surface.running.value = fold.running
  surface.pendingApprovals.value = fold.pendingApprovals
  surface.pendingQuestion.value = fold.pendingQuestion
}

/**
 * session transport 的 open / fetchHistory / fold。
 * 历史回放与实时 onEvent 走同一套 fold。
 */
export function createSessionRuntime(surface: SessionChatSurface) {
  let fold = createFoldState()
  let opened = false

  const apply = (event: ChatSessionEvent) => {
    fold = foldSessionEvent(fold, event)
    syncFold(fold, surface)
  }

  return {
    get opened() {
      return opened
    },
    attach(transport: ChatSessionTransport, onCleanup: (fn: () => void) => void) {
      // isServerTransport 只认 kind，不保证 open 存在
      if (typeof transport.open !== 'function') return
      fold = createFoldState()
      syncFold(fold, surface)
      let disposed = false
      const dispose = transport.open({
        onEvent(event) {
          if (!disposed) apply(event)
        },
        onDisconnect() {
          if (disposed) return
          fold = { ...fold, running: false }
          surface.running.value = false
        }
      })
      opened = true
      onCleanup(() => {
        disposed = true
        opened = false
        dispose()
      })
      void transport.fetchHistory().then(({ events }) => {
        if (disposed) return
        for (const event of events) apply(event)
      })
    },
    resetLocal() {
      fold = createFoldState()
      syncFold(fold, surface)
    }
  }
}
