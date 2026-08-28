import { describe, expect, it } from 'vitest'

import { createFoldState, foldSessionEvent } from '../fold'
import type { ChatSessionEvent } from '../session'

const foldAll = (events: ChatSessionEvent[]) => events.reduce(foldSessionEvent, createFoldState())

describe('foldSessionEvent', () => {
  it('user/message 按服务端回显追加，不制造本地占位', () => {
    const state = foldAll([{ type: 'user/message', messageId: 'u1', seq: 1, content: '你好' }])
    expect(state.messages).toEqual([{ id: 'u1', role: 'user', content: '你好' }])
  })

  it('assistant/chunk 按 messageId 累积 content 与 reasoning', () => {
    const state = foldAll([
      { type: 'assistant/chunk', messageId: 'a1', seq: 1, delta: '你', reasoningDelta: '想' },
      { type: 'assistant/chunk', messageId: 'a1', seq: 2, delta: '好', reasoningDelta: '一下' }
    ])
    expect(state.messages).toHaveLength(1)
    expect(state.messages[0]).toMatchObject({
      id: 'a1',
      role: 'assistant',
      content: '你好',
      reasoning: '想一下',
      status: 'streaming'
    })
  })

  it('assistant/message 定稿内容与状态', () => {
    const state = foldAll([
      { type: 'assistant/chunk', messageId: 'a1', seq: 1, delta: '草' },
      {
        type: 'assistant/message',
        messageId: 'a1',
        seq: 2,
        content: '你好世界',
        reasoning: '想完了'
      }
    ])
    expect(state.messages[0]).toMatchObject({
      id: 'a1',
      content: '你好世界',
      reasoning: '想完了',
      status: 'done'
    })
  })

  it('tool/call 追加 pending 的 ChatToolCall 并保留 view', () => {
    const view = { preview: 'ls' }
    const state = foldAll([
      { type: 'assistant/chunk', messageId: 'a1', seq: 1, delta: '' },
      { type: 'tool/call', callId: 'c1', name: 'bash', arguments: '{"cmd":"ls"}', seq: 2, view }
    ])
    expect(state.messages[0]?.toolCalls).toEqual([
      { id: 'c1', name: 'bash', arguments: '{"cmd":"ls"}', status: 'pending', view }
    ])
  })

  it('tool/result 按 callId 更新 status / result / error / view', () => {
    const state = foldAll([
      { type: 'tool/call', callId: 'c1', name: 'bash', arguments: '{}', seq: 1, view: { step: 1 } },
      {
        type: 'tool/result',
        callId: 'c1',
        status: 'error',
        result: 'out',
        error: 'boom',
        seq: 2,
        view: { step: 2 }
      }
    ])
    expect(state.messages[0]?.toolCalls?.[0]).toMatchObject({
      id: 'c1',
      status: 'error',
      result: 'out',
      error: 'boom',
      view: { step: 2 }
    })
  })

  it('queue/snapshot 与 jobs/snapshot 整体替换', () => {
    const state = foldAll([
      { type: 'queue/snapshot', items: [{ id: 'q1', content: '旧' }] },
      {
        type: 'jobs/snapshot',
        jobs: [{ id: 'j1', kind: 'bash', label: '旧作业', status: 'running' }]
      },
      { type: 'queue/snapshot', items: [{ id: 'q2', content: '新' }] },
      { type: 'jobs/snapshot', jobs: [{ id: 'j2', kind: 'web', label: '新作业', status: 'done' }] }
    ])
    expect(state.queue).toEqual([{ id: 'q2', content: '新' }])
    expect(state.jobs).toEqual([{ id: 'j2', kind: 'web', label: '新作业', status: 'done' }])
  })

  it('projection：tokenUsage 合并、title 取出、其余进 projections', () => {
    const state = foldAll([
      {
        type: 'projection',
        key: 'tokenUsage',
        seq: 1,
        value: { promptTokens: 1, completionTokens: 2, totalTokens: 3 }
      },
      {
        type: 'projection',
        key: 'tokenUsage',
        seq: 2,
        value: { promptTokens: 4, completionTokens: 5, totalTokens: 9 }
      },
      { type: 'projection', key: 'title', seq: 3, value: '会话标题' },
      { type: 'projection', key: 'extra', seq: 4, value: { n: 1 } }
    ])
    expect(state.tokenUsage).toEqual({ promptTokens: 5, completionTokens: 7, totalTokens: 12 })
    expect(state.title).toBe('会话标题')
    expect(state.projections).toEqual({ extra: { n: 1 } })
    expect(state.projections).not.toHaveProperty('title')
    expect(state.projections).not.toHaveProperty('tokenUsage')
  })

  it('乱序 seq 不覆盖已应用事件', () => {
    const applied = foldSessionEvent(createFoldState(), {
      type: 'user/message',
      messageId: 'u2',
      seq: 2,
      content: '后到的先到'
    })
    const skipped = foldSessionEvent(applied, {
      type: 'user/message',
      messageId: 'u1',
      seq: 1,
      content: '乱序应丢弃'
    })
    expect(skipped).toBe(applied)
    expect(skipped.messages).toEqual([{ id: 'u2', role: 'user', content: '后到的先到' }])
    expect(skipped.lastSeq).toBe(2)
  })
})
