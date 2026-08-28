import { describe, expect, it, vi } from 'vitest'

import { createFoldState, foldSessionEvent } from '../fold'
import * as chat from '../index'
import {
  createServerTransport,
  isServerTransport,
  type ChatSessionAdapter,
  type ChatSessionEvent
} from '../session'

function createFakeAdapter(options?: {
  catchUp?: ChatSessionEvent[]
}): ChatSessionAdapter & {
  emit: (event: ChatSessionEvent) => void
  disconnect: () => void
  unsubscribed: () => boolean
} {
  let listener: { onEvent(event: ChatSessionEvent): void; onDisconnect?(): void } | undefined
  let unsubscribed = false

  const adapter: ChatSessionAdapter = {
    subscribe(handlers) {
      listener = handlers
      return () => {
        unsubscribed = true
        listener = undefined
      }
    },
    send: vi.fn(async () => {}),
    cancel: vi.fn(async () => {}),
    respond: vi.fn(async () => {}),
    fetchHistory: vi.fn(async () => ({ events: options?.catchUp ?? [], hasMore: false })),
    selectModel: vi.fn(async () => {})
  }

  return Object.assign(adapter, {
    emit(event: ChatSessionEvent) {
      listener?.onEvent(event)
    },
    disconnect() {
      listener?.onDisconnect?.()
    },
    unsubscribed: () => unsubscribed
  })
}

describe('isServerTransport', () => {
  it('仅对 kind: session 的对象为 true', () => {
    const transport = createServerTransport(createFakeAdapter())
    expect(transport.kind).toBe('session')
    expect(isServerTransport(transport)).toBe(true)
    expect(isServerTransport({ kind: 'session' })).toBe(true)
    expect(isServerTransport(() => {})).toBe(false)
    expect(isServerTransport(null)).toBe(false)
    expect(isServerTransport(undefined)).toBe(false)
    expect(isServerTransport({})).toBe(false)
    expect(isServerTransport({ kind: 'client' })).toBe(false)
  })
})

describe('createServerTransport', () => {
  it('主入口导出 A1 符号且不导出 createBedrockTransport', () => {
    expect(chat.createServerTransport).toBeTypeOf('function')
    expect(chat.isServerTransport).toBeTypeOf('function')
    expect(chat.foldSessionEvent).toBeTypeOf('function')
    expect(chat.createFoldState).toBeTypeOf('function')
    expect('createBedrockTransport' in chat).toBe(false)
  })

  it('后到的更小 seq 丢弃且 console.warn，不打乱已折叠状态', () => {
    const adapter = createFakeAdapter()
    const transport = createServerTransport(adapter)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    let state = createFoldState()
    transport.open({
      onEvent(event) {
        state = foldSessionEvent(state, event)
      }
    })

    adapter.emit({ type: 'user/message', messageId: 'u2', seq: 2, content: '先到' })
    adapter.emit({ type: 'user/message', messageId: 'u1', seq: 1, content: '乱序' })

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]?.[0]).toMatch(/丢弃乱序事件/)
    expect(state.messages).toHaveLength(1)
    expect(state.messages[0]).toMatchObject({ id: 'u2', content: '先到' })
    warn.mockRestore()
  })

  it('open 的 disposer 释放订阅', () => {
    const adapter = createFakeAdapter()
    const transport = createServerTransport(adapter)
    const onEvent = vi.fn()
    const dispose = transport.open({ onEvent })

    adapter.emit({ type: 'finish' })
    expect(onEvent).toHaveBeenCalledTimes(1)

    dispose()
    expect(adapter.unsubscribed()).toBe(true)
    adapter.emit({ type: 'finish' })
    adapter.disconnect()
    expect(onEvent).toHaveBeenCalledTimes(1)
    expect(adapter.fetchHistory).not.toHaveBeenCalled()
  })

  it('断开后 fetchHistory(lastSeq) 补拉再 fold', async () => {
    const catchUp: ChatSessionEvent[] = [
      { type: 'user/message', messageId: 'u2', seq: 2, content: '补拉' }
    ]
    const adapter = createFakeAdapter({ catchUp })
    const transport = createServerTransport(adapter)
    let state = createFoldState()
    const onDisconnect = vi.fn()
    transport.open({
      onEvent(event) {
        state = foldSessionEvent(state, event)
      },
      onDisconnect
    })

    adapter.emit({ type: 'user/message', messageId: 'u1', seq: 1, content: '已有' })
    adapter.disconnect()

    await vi.waitFor(() => {
      expect(adapter.fetchHistory).toHaveBeenCalledWith(1)
      expect(state.messages.map((m) => m.id)).toEqual(['u1', 'u2'])
      expect(onDisconnect).toHaveBeenCalledTimes(1)
    })
  })

  it('send / cancel / respond / selectModel 同一动作未完成时忽略重复调用', async () => {
    const adapter = createFakeAdapter()
    let releaseSend!: () => void
    let releaseCancel!: () => void
    let releaseRespond!: () => void
    let releaseSelect!: () => void
    adapter.send = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          releaseSend = resolve
        })
    )
    adapter.cancel = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          releaseCancel = resolve
        })
    )
    adapter.respond = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          releaseRespond = resolve
        })
    )
    adapter.selectModel = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          releaseSelect = resolve
        })
    )

    const transport = createServerTransport(adapter)

    const send1 = transport.send('a')
    const send2 = transport.send('b')
    expect(adapter.send).toHaveBeenCalledTimes(1)
    releaseSend()
    await Promise.all([send1, send2])

    const cancel1 = transport.cancel()
    const cancel2 = transport.cancel()
    expect(adapter.cancel).toHaveBeenCalledTimes(1)
    releaseCancel()
    await Promise.all([cancel1, cancel2])

    const respond1 = transport.respond('rpc-1', true)
    const respond2 = transport.respond('rpc-2', false)
    expect(adapter.respond).toHaveBeenCalledTimes(1)
    releaseRespond()
    await Promise.all([respond1, respond2])

    const select1 = transport.selectModel('p', 'm1')
    const select2 = transport.selectModel('p', 'm2')
    expect(adapter.selectModel).toHaveBeenCalledTimes(1)
    releaseSelect()
    await Promise.all([select1, select2])
  })
})
