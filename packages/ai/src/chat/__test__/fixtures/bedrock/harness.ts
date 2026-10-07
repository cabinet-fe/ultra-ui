/**
 * Vendored from bedrock web/src/api（自包含快照，避免测试依赖仓库外绝对路径）。
 * 上游更新时同步此处；依赖面：@veltra/ai 类型 + ./http + ./types。
 */
import type { ChatSessionAdapter, ChatSessionEvent } from '@veltra/ai'

import { getAccessToken, http } from './http'
import type { PageResult } from './types'

/**
 * Harness session domain client (api/harness.md): REST endpoints plus the
 * /ws/harness/sessions/:id/events unified-frame stream, and a
 * ChatSessionAdapter that feeds bedrock frames into @veltra/ai session mode.
 */

// --- REST shapes ---

export interface HarnessModelRef {
  provider: string
  id: string
}

export interface HarnessPromptAck {
  id: string
  admitted_seq: number
}

/** Content part of GET /harness/sessions/:id/messages (provider passthrough). */
export type HarnessMessagePart =
  | { type: 'text'; id?: string; text: string }
  | { type: 'reasoning'; id?: string; text: string }
  | {
      type: 'tool'
      id?: string
      callID: string
      name?: string
      state: {
        status: 'pending' | 'running' | 'completed' | 'error'
        input?: unknown
        output?: string
        error?: string
      }
    }

export interface HarnessMessage {
  id: string
  role: string
  agent?: string
  model?: HarnessModelRef
  content?: HarnessMessagePart[]
}

// --- WS unified frame (api/harness.md HarnessFrame) ---

export type HarnessFrameKind =
  | 'status'
  | 'message_delta'
  | 'message_text'
  | 'reasoning_delta'
  | 'tool_call'
  | 'tool_result'
  | 'permission'
  | 'question'

export interface HarnessFrame {
  seq: number
  eventId?: string
  sessionId: string
  kind: HarnessFrameKind
  status?: {
    name:
      | 'prompt_admitted'
      | 'prompted'
      | 'step_started'
      | 'step_ended'
      | 'step_failed'
      | 'error'
      | 'idle'
    messageId?: string
    assistantMessageId?: string
    error?: string
  }
  messageDelta?: { assistantMessageId: string; textId: string; delta: string }
  messageText?: { assistantMessageId: string; textId: string; text: string }
  reasoningDelta?: { assistantMessageId: string; delta: string }
  toolCall?: { assistantMessageId: string; callId: string; tool: string; input?: unknown }
  toolResult?: { assistantMessageId: string; callId: string; output?: unknown; error?: string }
  permission?: { requestId: string; action: string; resources?: string[]; resolved?: string }
  question?: {
    requestId: string
    questions: { question: string; options?: string[] }[]
    resolved?: string
  }
}

const MESSAGES_PAGE_SIZE = 100
/** Bounds the history page loop against a misbehaving server. */
const MAX_HISTORY_PAGES = 100

export async function listSessionMessages(sessionId: string): Promise<HarnessMessage[]> {
  const items: HarnessMessage[] = []
  let page = 1
  for (let i = 0; i < MAX_HISTORY_PAGES; i++) {
    const { body } = await http.get<PageResult<HarnessMessage>>(
      `/harness/sessions/${sessionId}/messages`,
      { query: { page, page_size: MESSAGES_PAGE_SIZE } }
    )
    items.push(...(body.items ?? []))
    if (page >= (body.total_pages ?? 1)) break
    page++
  }
  return items
}

export async function sendSessionMessage(
  sessionId: string,
  text: string,
  delivery: 'queue' | 'steer' = 'queue'
): Promise<HarnessPromptAck> {
  const { body } = await http.post<HarnessPromptAck>(`/harness/sessions/${sessionId}/messages`, {
    text,
    delivery
  })
  return body
}

export async function interruptSession(sessionId: string): Promise<void> {
  await http.post(`/harness/sessions/${sessionId}/interrupt`, {})
}

export async function replySessionPermission(
  sessionId: string,
  requestId: string,
  reply: 'once' | 'always' | 'reject'
): Promise<void> {
  await http.post(`/harness/sessions/${sessionId}/permissions/${requestId}`, { reply })
}

export async function replySessionQuestion(
  sessionId: string,
  requestId: string,
  answers: string[][]
): Promise<void> {
  await http.post(`/harness/sessions/${sessionId}/questions/${requestId}`, { answers })
}

export function harnessSessionEventsWSURL(sessionId: string, token: string, after = 0): string {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${location.host}/ws/harness/sessions/${encodeURIComponent(sessionId)}/events?token=${encodeURIComponent(token)}&after=${after}`
}

// --- ChatSessionAdapter ---

function stringifyArg(value: unknown): string {
  if (value == null) return ''
  return typeof value === 'string' ? value : JSON.stringify(value)
}

type HarnessTextPart = Extract<HarnessMessagePart, { type: 'text' | 'reasoning' }>

function isTextPart(part: HarnessMessagePart): part is HarnessTextPart {
  return part.type === 'text' || part.type === 'reasoning'
}

function textOfParts(parts: HarnessMessagePart[] | undefined, type: 'text' | 'reasoning'): string {
  return (parts ?? [])
    .filter(isTextPart)
    .filter((part) => part.type === type)
    .map((part) => part.text)
    .join('')
}

/*
 * Transient frames (deltas) and history-derived events omit the `seq` field
 * on purpose: the transport-level seq gate drops any event whose seq does
 * not advance the cursor, and transient frames carry seq 0. History messages
 * have no seq at all, so the objects are cast at the emission sites.
 */

export interface HarnessSessionAdapterOptions {
  initialPrompt?: string
}

/**
 * History-replay event: carries the `history: true` marker the fold uses to
 * keep live streaming state authoritative (typed as an intersection until the
 * installed @veltra/ai version ships the field natively).
 */
type HistoryChatSessionEvent = ChatSessionEvent & { history?: boolean }

/** Synthetic user-message id seeding the run prompt before backend history has it. */
const SYNTHETIC_PROMPT_ID = 'run-initial-prompt'

function cleanUserContent(raw: string, initialPrompt?: string): string {
  if (!initialPrompt) return raw
  const trimmed = initialPrompt.trim()
  if (trimmed && raw.startsWith(trimmed)) {
    return initialPrompt
  }
  return raw
}

/**
 * Bedrock harness session adapter for @veltra/ai session mode.
 *
 * History replay (REST messages) and the WS unified-frame stream fold through
 * one runtime (createServerTransport); the seam between them is deduplicated
 * here by message id / text part id / tool call id, and pending asks are
 * idempotent by requestId (the WS handler re-sends them on connect).
 */
export function createHarnessSessionAdapter(
  sessionId: string,
  options?: HarnessSessionAdapterOptions
): ChatSessionAdapter {
  let handlers: { onEvent(event: ChatSessionEvent): void; onDisconnect?(): void } | null = null
  let ws: WebSocket | null = null
  let disposed = true
  /** WS frames are buffered until the initial history replay has been applied. */
  let synced = false
  const buffer: HarnessFrame[] = []
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined
  let reconnectDelay = 1000
  /** Highest durable seq delivered; reconnects resume the stream after it. */
  let lastDurableSeq = 0

  const seenUserIds = new Set<string>()
  const knownTextKeys = new Set<string>()
  const knownCallIds = new Set<string>()
  const finalCallIds = new Set<string>()
  const activePermissions = new Set<string>()
  let activeQuestionId: string | null = null
  /** message id -> finished text parts in arrival order. */
  const textParts = new Map<string, { id: string; text: string }[]>()
  /** message id -> accumulated reasoning text to prevent message_text wiping it out. */
  const reasoningParts = new Map<string, string>()
  /** Assistant messages already materialised in the fold (history or live). */
  const seenAssistantIds = new Set<string>()
  /**
   * Live assistant messages still in fold `streaming` status. History replay
   * emits `assistant/message` (done); live reasoning/tool steps only emit
   * `assistant/chunk`, so these must be closed explicitly or they stay
   * in-progress after the session is idle.
   */
  const openAssistantIds = new Set<string>()

  function emit(event: ChatSessionEvent): void {
    handlers?.onEvent(event)
  }

  function assistantContent(messageId: string): string {
    return (textParts.get(messageId) ?? []).map((part) => part.text).join('')
  }

  /** Fold treats `assistant/message` as the done marker; `finish` only clears running. */
  function finalizeAssistant(messageId: string): void {
    if (!messageId || !openAssistantIds.has(messageId)) return
    openAssistantIds.delete(messageId)
    emit({
      type: 'assistant/message',
      messageId,
      content: assistantContent(messageId),
      reasoning: reasoningParts.get(messageId) || undefined
    } as ChatSessionEvent)
  }

  function finalizeOpenAssistants(except?: string): void {
    const ids: string[] = []
    for (const id of openAssistantIds) {
      if (id !== except) ids.push(id)
    }
    for (const id of ids) finalizeAssistant(id)
  }

  /**
   * Open `messageId` as the sole in-progress assistant. Closes any other
   * streaming thinking block first. `stub` creates an empty streaming
   * message so a subsequent tool/call attaches to this id, not the previous.
   */
  function beginAssistant(messageId: string, stub = false): void {
    if (!messageId) return
    finalizeOpenAssistants(messageId)
    if (!seenAssistantIds.has(messageId)) {
      seenAssistantIds.add(messageId)
      if (stub) {
        emit({ type: 'assistant/chunk', messageId, delta: '' } as ChatSessionEvent)
      }
    }
    openAssistantIds.add(messageId)
  }

  function onMessageText(messageId: string, textId: string, text: string, seq: number): void {
    const key = `${messageId}:${textId}`
    if (knownTextKeys.has(key)) return
    knownTextKeys.add(key)
    const parts = textParts.get(messageId) ?? []
    const index = parts.findIndex((part) => part.id === textId)
    if (index >= 0) parts[index] = { id: textId, text }
    else parts.push({ id: textId, text })
    textParts.set(messageId, parts)
    beginAssistant(messageId)
    emit({
      type: 'assistant/message',
      messageId,
      seq,
      content: parts.map((part) => part.text).join(''),
      reasoning: reasoningParts.get(messageId) || undefined
    })
    // Text-ended already marks the fold message done.
    openAssistantIds.delete(messageId)
  }

  function onFrame(frame: HarnessFrame): void {
    if (!synced) {
      buffer.push(frame)
      return
    }
    deliverFrame(frame)
  }

  function deliverFrame(frame: HarnessFrame): void {
    if (frame.seq > lastDurableSeq) lastDurableSeq = frame.seq
    switch (frame.kind) {
      case 'status': {
        const status = frame.status
        if (!status) return
        switch (status.name) {
          case 'prompt_admitted':
          case 'prompted':
            if (
              status.messageId &&
              !seenUserIds.has(status.messageId) &&
              options?.initialPrompt?.trim()
            ) {
              // Only mark seen when we actually emit: otherwise history replay
              // can still surface the composed prompt (workspace hint, etc.).
              seenUserIds.add(status.messageId)
              // The synthetic prompt turn may already be seeded for this run
              // (chat mounted before the prompt hit backend history): adopting
              // the id keeps later history replays quiet without emitting a
              // duplicate user turn.
              if (!seenUserIds.has(SYNTHETIC_PROMPT_ID)) {
                emit({
                  type: 'user/message',
                  messageId: status.messageId,
                  content: options.initialPrompt
                } as ChatSessionEvent)
              }
            }
            emit({ type: 'running', running: true })
            return
          case 'step_started':
            // Next LLM step: close leftover thinking so at most one block is in-progress.
            finalizeOpenAssistants(status.assistantMessageId)
            return
          case 'step_ended':
            if (status.assistantMessageId) finalizeAssistant(status.assistantMessageId)
            else finalizeOpenAssistants()
            return
          case 'step_failed':
            finalizeOpenAssistants()
            emit({ type: 'error', code: 'step_failed', message: status.error || 'step failed' })
            return
          case 'error':
            finalizeOpenAssistants()
            emit({ type: 'error', code: 'harness_error', message: status.error || 'harness error' })
            return
          case 'idle':
            finalizeOpenAssistants()
            if (textParts.size === 0) {
              // Prep window can finish the turn before the chat mounts; pull
              // history so a late assistant message is not dropped by finish.
              void fetchHistory().then(
                ({ events }) => {
                  if (disposed) return
                  for (const event of events) emit(event)
                  emit({ type: 'finish' })
                },
                () => {
                  if (!disposed) emit({ type: 'finish' })
                }
              )
              return
            }
            emit({ type: 'finish' })
            return
          default:
            return
        }
      }
      case 'message_delta': {
        const delta = frame.messageDelta
        if (!delta) return
        beginAssistant(delta.assistantMessageId)
        emit({
          type: 'assistant/chunk',
          messageId: delta.assistantMessageId,
          delta: delta.delta
        } as ChatSessionEvent)
        return
      }
      case 'reasoning_delta': {
        const delta = frame.reasoningDelta
        if (!delta) return
        const msgId = delta.assistantMessageId
        beginAssistant(msgId)
        reasoningParts.set(msgId, (reasoningParts.get(msgId) ?? '') + delta.delta)
        emit({
          type: 'assistant/chunk',
          messageId: msgId,
          delta: '',
          reasoningDelta: delta.delta
        } as ChatSessionEvent)
        return
      }
      case 'message_text': {
        const text = frame.messageText
        if (!text) return
        onMessageText(text.assistantMessageId, text.textId, text.text, frame.seq)
        return
      }
      case 'tool_call': {
        const call = frame.toolCall
        if (!call || knownCallIds.has(call.callId)) return
        knownCallIds.add(call.callId)
        // Stub first if this assistant message is new so the call attaches here.
        beginAssistant(call.assistantMessageId, true)
        emit({
          type: 'tool/call',
          callId: call.callId,
          name: call.tool,
          arguments: stringifyArg(call.input),
          seq: frame.seq
        })
        return
      }
      case 'tool_result': {
        const result = frame.toolResult
        if (!result || finalCallIds.has(result.callId)) return
        finalCallIds.add(result.callId)
        emit({
          type: 'tool/result',
          callId: result.callId,
          status: result.error ? 'error' : 'success',
          result: result.output == null ? undefined : stringifyArg(result.output),
          error: result.error || undefined,
          seq: frame.seq
        })
        return
      }
      case 'permission': {
        const permission = frame.permission
        if (!permission) return
        // The bridge echoes every applied answer (auto-approve, another
        // client, TTL reject) as a resolved frame: close the card, never ask.
        if (permission.resolved) {
          if (activePermissions.delete(permission.requestId)) {
            emit({
              type: 'approval/resolved',
              approvalId: permission.requestId,
              outcome: permission.resolved
            })
          }
          return
        }
        if (activePermissions.has(permission.requestId)) return
        activePermissions.add(permission.requestId)
        emit({
          type: 'approval/requested',
          approvalId: permission.requestId,
          toolName: permission.action,
          reason: permission.resources?.join(', ') || undefined,
          rpcId: permission.requestId
        })
        return
      }
      case 'question': {
        const question = frame.question
        if (!question) return
        if (question.resolved) {
          if (activeQuestionId != null) {
            emit({
              type: 'question/resolved',
              questionRpcId: activeQuestionId,
              outcome: 'cancelled'
            })
            activeQuestionId = null
          }
          return
        }
        if (activeQuestionId === question.requestId) return
        activeQuestionId = question.requestId
        emit({
          type: 'question/requested',
          questions: question.questions.map((item) => ({
            question: item.question,
            options: item.options?.length ? item.options : undefined
          })),
          rpcId: question.requestId
        })
        return
      }
    }
  }

  function openWS(): void {
    if (disposed) return
    const token = getAccessToken()
    if (!token) {
      handlers?.onDisconnect?.()
      return
    }
    const socket = new WebSocket(harnessSessionEventsWSURL(sessionId, token, lastDurableSeq))
    ws = socket
    socket.onmessage = (event) => {
      try {
        onFrame(JSON.parse(String(event.data)) as HarnessFrame)
      } catch {
        /* skip malformed frames */
      }
    }
    socket.onclose = () => {
      if (disposed || ws !== socket) return
      ws = null
      handlers?.onDisconnect?.()
      reconnectDelay = Math.min(reconnectDelay * 2, 15_000)
      reconnectTimer = setTimeout(openWS, reconnectDelay)
    }
    socket.onerror = () => {
      socket.close()
    }
  }

  function flushBuffer(): void {
    synced = true
    for (const frame of buffer.splice(0)) {
      deliverFrame(frame)
    }
  }

  async function fetchHistory(): Promise<{ events: ChatSessionEvent[]; hasMore: boolean }> {
    const messages = await listSessionMessages(sessionId)
    const events: ChatSessionEvent[] = []
    let foundUserMessage = false
    let foundOpenAssistant = false

    for (const message of messages) {
      if (message.role === 'user') {
        if (seenUserIds.has(message.id)) {
          foundUserMessage = true
          continue
        }
        seenUserIds.add(message.id)
        foundUserMessage = true
        const rawText = textOfParts(message.content, 'text')
        events.push({
          type: 'user/message',
          messageId: message.id,
          content: cleanUserContent(rawText, options?.initialPrompt),
          history: true
        } as HistoryChatSessionEvent)
        continue
      }
      if (message.role !== 'assistant') continue
      // 仍在直播流式中的消息：历史必然是落后快照（甚至为空），跳过回放 ——
      // 否则断线补拉会把流式消息标记成 done、清空/缩短内容，重连续流又翻回
      // streaming，消息在「完成 / 思考中」间来回翻转；终态由重连回放的 durable
      // 帧（message_text / tool_result）落定。去重键（textKeys / callIds）也
      // 不登记，避免重连后的 durable 终态帧被误判重复而丢弃。
      if (openAssistantIds.has(message.id)) {
        foundOpenAssistant = true
        continue
      }
      seenAssistantIds.add(message.id)
      const toolCalls: {
        id: string
        name: string
        arguments: string
        status: 'running' | 'success' | 'error'
        result?: string
        error?: string
      }[] = []
      for (const part of message.content ?? []) {
        if (part.type === 'text' || part.type === 'reasoning') {
          if (part.id) {
            knownTextKeys.add(`${message.id}:${part.id}`)
            if (part.type === 'reasoning' && part.text) {
              reasoningParts.set(message.id, (reasoningParts.get(message.id) ?? '') + part.text)
            }
          }
          continue
        }
        knownCallIds.add(part.callID)
        const status =
          part.state?.status === 'completed'
            ? 'success'
            : part.state?.status === 'error'
              ? 'error'
              : 'running'
        if (status !== 'running') finalCallIds.add(part.callID)

        let result = part.state?.output
        if (result == null && (part.state as { content?: unknown })?.content != null) {
          const c = (part.state as { content?: unknown }).content
          if (typeof c === 'string') {
            result = c
          } else if (Array.isArray(c)) {
            result = c
              .map((item: unknown) => {
                if (typeof item === 'string') return item
                if (
                  item &&
                  typeof item === 'object' &&
                  'text' in item &&
                  typeof (item as { text: unknown }).text === 'string'
                ) {
                  return (item as { text: string }).text
                }
                return stringifyArg(item)
              })
              .join('')
          } else {
            result = stringifyArg(c)
          }
        }

        toolCalls.push({
          id: part.callID,
          name: part.name ?? '',
          arguments: stringifyArg(part.state?.input),
          status,
          result: result == null ? undefined : result,
          error: part.state?.error || undefined
        })
      }
      const reasoning = textOfParts(message.content, 'reasoning')
      if (reasoning) {
        reasoningParts.set(message.id, reasoning)
      }
      events.push({
        type: 'assistant/message',
        messageId: message.id,
        content: textOfParts(message.content, 'text'),
        reasoning: reasoning || undefined,
        toolCalls: toolCalls.length ? toolCalls : undefined,
        history: true
      } as HistoryChatSessionEvent)
    }

    // If initial history fetch yielded no user message yet (prompt still being submitted in backend),
    // and an assistant message is not already streaming, seed it so the user sees their prompt immediately.
    if (!foundUserMessage && !foundOpenAssistant && options?.initialPrompt?.trim()) {
      const syntheticId = SYNTHETIC_PROMPT_ID
      if (!seenUserIds.has(syntheticId)) {
        seenUserIds.add(syntheticId)
        events.unshift({
          type: 'user/message',
          messageId: syntheticId,
          content: options.initialPrompt
        } as HistoryChatSessionEvent)
      }
    }

    return { events, hasMore: false }
  }

  return {
    subscribe(registrant) {
      handlers = registrant
      disposed = false
      openWS()
      // The adapter owns the initial history replay: emit its events first,
      // then flush the buffered WS frames so the seam order is deterministic
      // (old -> new) and deduplicated. The runtime's own fetchHistory call
      // reuses the same dedup state and converges to no-op.
      fetchHistory().then(
        ({ events }) => {
          for (const event of events) emit(event)
          flushBuffer()
        },
        () => {
          flushBuffer()
          handlers?.onDisconnect?.()
        }
      )
      return () => {
        disposed = true
        handlers = null
        if (reconnectTimer) clearTimeout(reconnectTimer)
        ws?.close()
        ws = null
        buffer.length = 0
        synced = false
      }
    },
    async send(content) {
      const ack = await sendSessionMessage(sessionId, content)
      if (disposed || seenUserIds.has(ack.id)) return
      seenUserIds.add(ack.id)
      emit({ type: 'user/message', messageId: ack.id, content } as ChatSessionEvent)
    },
    cancel() {
      return interruptSession(sessionId)
    },
    async respond(rpcId, ok, value) {
      if (activePermissions.has(rpcId)) {
        try {
          await replySessionPermission(sessionId, rpcId, ok ? 'once' : 'reject')
        } catch (err) {
          // The bridge already answered the ask (auto-approve beat the click);
          // anything else is a real failure.
          if (!(err instanceof Error) || !err.message.includes('harness-pending-not-found'))
            throw err
        }
        activePermissions.delete(rpcId)
        emit({ type: 'approval/resolved', approvalId: rpcId, outcome: ok ? 'once' : 'rejected' })
        return
      }
      if (activeQuestionId === rpcId) {
        const list = (
          Array.isArray(value) ? value : (value as { answers?: unknown } | undefined)?.answers
        ) as { answer?: string }[] | undefined
        const answers = (list ?? []).map((item) => [item?.answer ?? ''])
        await replySessionQuestion(sessionId, rpcId, answers)
        activeQuestionId = null
        emit({ type: 'question/resolved', questionRpcId: rpcId, outcome: 'answered' })
      }
    },
    fetchHistory,
    // No mid-session model switch exists in the contract and the chat shows
    // no model picker, so this is never invoked.
    async selectModel() {
      /* not supported */
    }
  }
}
