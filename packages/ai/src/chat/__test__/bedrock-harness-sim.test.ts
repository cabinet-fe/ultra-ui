/**
 * 复现床架(bedrock/opencode)会话面板「消息数量跳变 / 完成与思考中来回翻转」的仿真测试。
 *
 * 驱动源是 opencode 1.18.31 实测事件序列(慢工具 + 排队续问)，经真实的
 * bedrock adapter(/api/harness.ts)→ createServerTransport → fold → message-list
 * turns 分组逐帧检查 UI 可见状态。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

vi.mock('/Users/whj/codes/bedrock/web/src/api/http', () => {
  return {
    getAccessToken: () => 'test-token',
    http: {
      get: (...args: unknown[]) => mockHttpGet(...(args as [string, never])),
      post: (...args: unknown[]) => mockHttpPost(...(args as [string, never]))
    }
  }
})

// eslint-disable-next-line import/first
import {
  createHarnessSessionAdapter,
  type HarnessFrame
} from '/Users/whj/codes/bedrock/web/src/api/harness'

// eslint-disable-next-line import/first
import { createFoldState, foldSessionEvent, type ChatFoldState } from '../fold'
// eslint-disable-next-line import/first
import { createServerTransport } from '../session'

// ---- mock 网络层 ----

type HistoryMessage = {
  id: string
  role: string
  content?: {
    type: string
    id?: string
    text?: string
    callID?: string
    name?: string
    state?: unknown
  }[]
}

const historyStore: HistoryMessage[] = []
let mockHttpGet: (
  path: string,
  opts?: { query?: Record<string, unknown> }
) => Promise<{ body: unknown }> = async () => ({ body: {} })
let mockHttpPost: (path: string, body?: unknown) => Promise<{ body: unknown }> = async () => ({
  body: {}
})

function setHistory(list: HistoryMessage[]): void {
  historyStore.length = 0
  historyStore.push(...list)
}

// ---- mock WebSocket ----

interface MockSocket {
  url: string
  onmessage: ((e: { data: string }) => void) | null
  onclose: (() => void) | null
  onerror: (() => void) | null
  close(): void
}

let sockets: MockSocket[] = []
let serverReplay: ((after: number) => HarnessFrame[]) | null = null

class MockWebSocket implements MockSocket {
  url: string
  onmessage: ((e: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  closed = false

  constructor(url: string) {
    this.url = url
    sockets.push(this)
  }

  close(): void {
    if (this.closed) return
    this.closed = true
    this.onclose?.()
  }

  /** 测试端注入一帧 */
  serverPush(frame: HarnessFrame): void {
    this.onmessage?.({ data: JSON.stringify(frame) })
  }

  /** 模拟服务端：回放 after 之后的持久帧 */
  serverConnect(): void {
    const after = Number(new URL(this.url).searchParams.get('after') ?? '0')
    for (const frame of serverReplay?.(after) ?? []) this.serverPush(frame)
  }
}

// ---- message-list 的 turns 分组(照抄 message-list.vue) ----

interface ChatMessageLike {
  id: string
  role: string
  content: string
  status?: string
  reasoning?: string
  toolCalls?: unknown[]
}

const isFinalStatus = (msg?: ChatMessageLike) =>
  msg?.status === 'done' || msg?.status === 'error' || msg?.status === 'aborted'

/** 返回 UI 可见结构: 每轮 { user, processCount | 已完成fold, answer } */
function uiSnapshot(messages: ChatMessageLike[], running: boolean) {
  const visible = messages.filter((m) => m.role !== 'tool')
  const grouped: { key: string; userMsg?: ChatMessageLike; assistants: ChatMessageLike[] }[] = []
  for (const msg of visible) {
    if (msg.role === 'user') {
      grouped.push({ key: msg.id, userMsg: msg, assistants: [] })
      continue
    }
    const last = grouped[grouped.length - 1]
    if (last) last.assistants.push(msg)
    else grouped.push({ key: msg.id, assistants: [msg] })
  }
  let visibleItems = 0
  const parts: string[] = []
  grouped.forEach((turn, index) => {
    const processMsgs = turn.assistants.slice(0, -1)
    const answerMsg = turn.assistants[turn.assistants.length - 1]
    const isLastTurn = index === grouped.length - 1
    const processCollapsed =
      processMsgs.length > 0 && (!isLastTurn || (!running && isFinalStatus(answerMsg)))
    if (turn.userMsg) visibleItems += 1
    if (processCollapsed) {
      visibleItems += 1
      parts.push(`fold(${processMsgs.length})`)
    } else {
      visibleItems += processMsgs.length
      parts.push(...processMsgs.map((m) => `proc:${m.status}`))
    }
    if (answerMsg) {
      visibleItems += 1
      const thinking = answerMsg.status === 'streaming' && !answerMsg.content
      parts.push(`answer:${answerMsg.status}${thinking ? '(思考中…)' : ''}`)
    }
  })
  return { running, visibleItems, parts }
}

// ---- 帧构造工具(对齐 opencode 实测 wire) ----

const SES = 'ses_test'
let seq = 0
const nextSeq = () => ++seq

function statusFrame(name: string, extra: Record<string, unknown> = {}): HarnessFrame {
  return { seq: 0, sessionId: SES, kind: 'status', status: { name, ...extra } as never }
}
function durable(frame: HarnessFrame, s: number): HarnessFrame {
  frame.seq = s
  return frame
}
function textDelta(msgId: string, delta: string): HarnessFrame {
  return {
    seq: 0,
    sessionId: SES,
    kind: 'message_delta',
    messageDelta: { assistantMessageId: msgId, textId: 'text-0', delta }
  }
}
function reasoningDelta(msgId: string, delta: string): HarnessFrame {
  return {
    seq: 0,
    sessionId: SES,
    kind: 'reasoning_delta',
    reasoningDelta: { assistantMessageId: msgId, delta }
  }
}
function textEnded(msgId: string, text: string): HarnessFrame {
  return {
    seq: nextSeq(),
    sessionId: SES,
    kind: 'message_text',
    messageText: { assistantMessageId: msgId, textId: 'text-0', text }
  }
}
function toolCall(msgId: string, callId: string): HarnessFrame {
  return {
    seq: nextSeq(),
    sessionId: SES,
    kind: 'tool_call',
    toolCall: { assistantMessageId: msgId, callId, tool: 'bash', input: { command: 'sleep 8' } }
  }
}
function toolResult(callId: string): HarnessFrame {
  return {
    seq: nextSeq(),
    sessionId: SES,
    kind: 'tool_result',
    toolResult: { assistantMessageId: 'msg_A', callId, output: 'slow-done' }
  }
}

// ---- 测试驱动 ----

describe('bedrock harness 会话面板仿真', () => {
  let state: ChatFoldState
  let dispose: (() => void) | undefined
  let userMsgSeq = 100 // opencode 用户消息历史 id 序列

  beforeEach(() => {
    vi.useFakeTimers()
    sockets = []
    serverReplay = null
    seq = 0
    setHistory([])
    mockHttpGet = async (path: string) => {
      if (path.endsWith('/messages')) {
        return { body: { items: [...historyStore], total_pages: 1 } }
      }
      return { body: {} }
    }
    mockHttpPost = async () => ({ body: { id: '', admitted_seq: 0 } })
    vi.stubGlobal('WebSocket', MockWebSocket as unknown as typeof WebSocket)
  })

  afterEach(() => {
    dispose?.()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  function attach(): void {
    const adapter = createHarnessSessionAdapter(SES, { initialPrompt: '跑起来' })
    const transport = createServerTransport(adapter)
    state = createFoldState()
    dispose = transport.open({
      onEvent(event) {
        state = foldSessionEvent(state, event)
      }
    })
  }

  async function flush(): Promise<void> {
    await vi.advanceTimersByTimeAsync(0)
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(0)
  }

  it('场景A: 健康单轮(慢工具+思考) 不应出现状态来回翻转', async () => {
    attach()
    // 订阅内部 fetchHistory 完成
    await flush()
    const ws = sockets[0]!
    ws.serverConnect()

    const flips: string[] = []
    const record = (label: string) => {
      const snap = uiSnapshot(state.messages as unknown as ChatMessageLike[], state.running)
      flips.push(
        `${label} => running=${snap.running} items=${snap.visibleItems} [${snap.parts.join(', ')}]`
      )
    }

    setHistory([{ id: 'msg_user', role: 'user', content: [{ type: 'text', text: '跑起来' }] }])
    await flush()

    ws.serverPush(durable(statusFrame('prompt_admitted', { messageId: 'msg_user' }), nextSeq()))
    ws.serverPush(durable(statusFrame('prompted', { messageId: 'msg_user' }), nextSeq()))
    record('prompted')

    // step1: msg_A 思考 + 工具调用(慢工具 8s,期间无事件)
    ws.serverPush(durable(statusFrame('step_started', { assistantMessageId: 'msg_A' }), nextSeq()))
    ws.serverPush(reasoningDelta('msg_A', '正在思考工具调用...'))
    record('step1-reasoning')
    ws.serverPush(durable(toolCall('msg_A', 'call_1'), nextSeq()))
    record('step1-toolcall')
    // 8s 工具静默期
    await vi.advanceTimersByTimeAsync(8000)
    ws.serverPush(durable(toolResult('call_1'), nextSeq()))
    ws.serverPush(durable(statusFrame('step_ended', { assistantMessageId: 'msg_A' }), nextSeq()))
    setHistory([
      { id: 'msg_user', role: 'user', content: [{ type: 'text', text: '跑起来' }] },
      {
        id: 'msg_A',
        role: 'assistant',
        content: [
          {
            type: 'tool',
            callID: 'call_1',
            name: 'bash',
            state: { status: 'completed', input: {}, output: 'slow-done' }
          }
        ]
      }
    ])
    record('step1-ended')

    // step2: msg_B 正文流式
    ws.serverPush(durable(statusFrame('step_started', { assistantMessageId: 'msg_B' }), nextSeq()))
    ws.serverPush(textDelta('msg_B', '命令'))
    record('step2-delta1')
    ws.serverPush(textDelta('msg_B', '输出为 slow-done'))
    record('step2-delta2')
    ws.serverPush(durable(textEnded('msg_B', '命令输出为 slow-done'), nextSeq()))
    ws.serverPush(durable(statusFrame('step_ended', { assistantMessageId: 'msg_B' }), nextSeq()))
    setHistory([
      { id: 'msg_user', role: 'user', content: [{ type: 'text', text: '跑起来' }] },
      {
        id: 'msg_A',
        role: 'assistant',
        content: [
          {
            type: 'tool',
            callID: 'call_1',
            name: 'bash',
            state: { status: 'completed', input: {}, output: 'slow-done' }
          }
        ]
      },
      {
        id: 'msg_B',
        role: 'assistant',
        content: [{ type: 'text', id: 'text-0', text: '命令输出为 slow-done' }]
      }
    ])
    record('turn1-end')

    // 桥 2s 后合成 idle
    ws.serverPush(statusFrame('idle'))
    record('idle')

    // 健康路径: idle 前不应出现 fold(已完成) 与 running=false
    const beforeIdle = flips.slice(0, -1)
    for (const line of beforeIdle) {
      expect(line).not.toMatch(/running=false/)
      expect(line).not.toMatch(/fold/)
    }
  })

  it('场景B: WS 断线重连(流式中途) 观察状态翻转与内容重复', async () => {
    attach()
    await flush()
    const ws = sockets[0]!
    ws.serverConnect()
    setHistory([{ id: 'msg_user', role: 'user', content: [{ type: 'text', text: '跑起来' }] }])
    await flush()

    const flips: string[] = []
    const record = (label: string) => {
      const snap = uiSnapshot(state.messages as unknown as ChatMessageLike[], state.running)
      flips.push(
        `${label} => running=${snap.running} items=${snap.visibleItems} [${snap.parts.join(', ')}]`
      )
    }

    ws.serverPush(durable(statusFrame('prompt_admitted', { messageId: 'msg_user' }), nextSeq()))
    ws.serverPush(durable(statusFrame('prompted', { messageId: 'msg_user' }), nextSeq()))
    ws.serverPush(durable(statusFrame('step_started', { assistantMessageId: 'msg_B' }), nextSeq()))
    ws.serverPush(textDelta('msg_B', '命令输出'))
    record('streaming')

    // 流式中途断线: 历史里已有部分文本(opencode 持久化 text part 的中间快照)
    setHistory([
      { id: 'msg_user', role: 'user', content: [{ type: 'text', text: '跑起来' }] },
      {
        id: 'msg_B',
        role: 'assistant',
        content: [{ type: 'text', id: 'text-0', text: '命令输出' }]
      }
    ])
    ws.close()
    // onDisconnect → fetchHistory(历史快照可能落后); 重连退避(翻倍到 2s)
    await vi.advanceTimersByTimeAsync(50)
    record('disconnected(补拉后)')
    await vi.advanceTimersByTimeAsync(2500)
    const ws2 = sockets[1]!
    // 服务端回放 after 之后无新帧; 直播继续
    serverReplay = () => []
    ws2.serverConnect()
    ws2.serverPush(textDelta('msg_B', '为 slow-done'))
    record('重连续流')
    ws2.serverPush(durable(textEnded('msg_B', '命令输出为 slow-done'), nextSeq()))
    record('text-ended')

    const msgB = () =>
      (state.messages as unknown as ChatMessageLike[]).find((m) => m.id === 'msg_B')
    // 断线补拉不得把流式消息标记 done(状态不翻转)
    expect(flips[1]).toMatch(/answer:streaming/)
    // 重连续流仍为 streaming, 且终态帧落地为 done、内容为全文
    expect(flips[2]).toMatch(/answer:streaming/)
    expect(flips[3]).toMatch(/answer:done/)
    expect(msgB()?.content).toBe('命令输出为 slow-done')
  })

  it('场景C: 运行中 history 补拉(落后空快照)不得清空直播内容或翻转 done', async () => {
    attach()
    await flush()
    const ws = sockets[0]!
    ws.serverConnect()
    const flips: string[] = []
    const flipsContent: string[] = []
    const record = (label: string) => {
      const snap = uiSnapshot(state.messages as unknown as ChatMessageLike[], state.running)
      flips.push(
        `${label} => running=${snap.running} items=${snap.visibleItems} [${snap.parts.join(', ')}]`
      )
      flipsContent.push(
        String(
          (state.messages as unknown as ChatMessageLike[]).find((m) => m.id === 'msg_B')?.content ??
            ''
        )
      )
    }

    setHistory([{ id: 'msg_user', role: 'user', content: [{ type: 'text', text: '跑起来' }] }])
    await flush()
    ws.serverPush(durable(statusFrame('prompted', { messageId: 'msg_user' }), nextSeq()))
    ws.serverPush(durable(statusFrame('step_started', { assistantMessageId: 'msg_B' }), nextSeq()))
    ws.serverPush(textDelta('msg_B', '部分'))
    record('live-delta')

    // 模拟运行中一次补拉(onDisconnect 路径), 历史快照落后于直播流
    setHistory([
      { id: 'msg_user', role: 'user', content: [{ type: 'text', text: '跑起来' }] },
      { id: 'msg_B', role: 'assistant', content: [] }
    ])
    ws.close()
    await vi.advanceTimersByTimeAsync(50)
    record('补拉(空快照)')
    // record 同时快照当时内容
    // 重连后直播继续
    await vi.advanceTimersByTimeAsync(2500)
    const ws2 = sockets[1]!
    serverReplay = () => []
    ws2.serverConnect()
    ws2.serverPush(textDelta('msg_B', '文本'))
    record('重连续流')

    // 落后空快照不得清空直播内容、不得翻转 done
    const contentAt = (i: number) => flipsContent[i]
    expect(flips[1]).toMatch(/answer:streaming/)
    expect(contentAt(1)).toBe('部分')
    expect(flips[2]).toMatch(/answer:streaming/)
    expect(contentAt(2)).toBe('部分文本')
  })

  it('场景D: 挂载早于 prompt 入库时, 合成用户轮次不被 prompt_admitted 重复', async () => {
    // 空历史挂载(pending 窗口): 合成 initialPrompt 种子
    attach()
    await flush()
    const ws = sockets[0]!
    ws.serverConnect()
    await flush()

    const userTurns = () =>
      (state.messages as unknown as ChatMessageLike[]).filter((m) => m.role === 'user')
    expect(userTurns()).toHaveLength(1)

    // prompt_admitted 到达(消息已入队但历史仍空): 不得再发第二条用户消息
    ws.serverPush(durable(statusFrame('prompt_admitted', { messageId: 'msg_user' }), nextSeq()))
    ws.serverPush(durable(statusFrame('prompted', { messageId: 'msg_user' }), nextSeq()))
    expect(userTurns()).toHaveLength(1)
    expect(state.running).toBe(true)
  })
})
