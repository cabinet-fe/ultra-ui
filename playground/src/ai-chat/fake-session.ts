import { sleep } from '@cat-kit/core'
import type { ChatSessionAdapter, ChatSessionEvent } from '@veltra/ai'

/** 服务端模式欢迎语，与 send 关键词分流对齐 */
export const SESSION_WELCOME = [
  '演示未知工具卡片',
  '向我提几个问题',
  '弹出无 callId 的审批横幅',
  '展示作业条',
  '按顺序跑完全部演示'
]

type DemoKind = 'tool' | 'question' | 'approval' | 'jobs' | 'all'

type DemoStep =
  | { type: 'delay'; ms: number }
  | { type: 'emit'; event: ChatSessionEvent }
  | { type: 'wait'; rpcId: string; kind: 'question' | 'approval'; approvalId?: string }

function pickDemo(content: string): DemoKind {
  if (/提问|问题|question/i.test(content)) return 'question'
  if (/审批|横幅|approval/i.test(content)) return 'approval'
  if (/作业|jobs?/i.test(content)) return 'jobs'
  if (/未知|工具卡|totally-unknown/i.test(content)) return 'tool'
  return 'all'
}

/**
 * 页内 fake adapter：不发起任何 HTTP/WS。
 * 按用户消息关键词演示未知工具卡、提问、无 callId 审批横幅、作业条。
 */
export function createFakeSessionAdapter(): ChatSessionAdapter {
  let listener: { onEvent(event: ChatSessionEvent): void; onDisconnect?(): void } | undefined
  let seq = 0
  let ids = 0
  let gen = 0
  const waiters = new Map<
    string,
    { kind: 'question' | 'approval'; approvalId?: string; done: () => void }
  >()

  const nextSeq = () => ++seq
  const nextId = (prefix: string) => `${prefix}-${++ids}`

  const emit = (event: ChatSessionEvent) => {
    listener?.onEvent(event)
  }

  const invalidate = () => {
    waiters.forEach((item, rpcId) => {
      if (item.kind === 'question') {
        emit({ type: 'question/resolved', questionRpcId: rpcId, outcome: 'cancelled' })
      } else {
        emit({
          type: 'approval/resolved',
          approvalId: item.approvalId ?? rpcId,
          outcome: 'cancelled'
        })
      }
      item.done()
    })
    waiters.clear()
  }

  const waitRespond = (step: Extract<DemoStep, { type: 'wait' }>) =>
    new Promise<void>((resolve) => {
      waiters.set(step.rpcId, { kind: step.kind, approvalId: step.approvalId, done: resolve })
    })

  const runSteps = (token: number, steps: DemoStep[], i = 0): Promise<void> => {
    if (token !== gen || i >= steps.length) return Promise.resolve()
    const step = steps[i]!
    if (step.type === 'delay') {
      return sleep(step.ms).then(() => runSteps(token, steps, i + 1))
    }
    if (step.type === 'emit') {
      emit(step.event)
      return runSteps(token, steps, i + 1)
    }
    return waitRespond(step).then(() => runSteps(token, steps, i + 1))
  }

  const toolSteps = (assistantId: string): DemoStep[] => {
    const callId = nextId('call')
    return [
      {
        type: 'emit',
        event: {
          type: 'assistant/chunk',
          messageId: assistantId,
          seq: nextSeq(),
          delta: '调用一个从未注册的工具。'
        }
      },
      { type: 'delay', ms: 280 },
      {
        type: 'emit',
        event: {
          type: 'tool/call',
          callId,
          name: 'totally-unknown-tool-xyz',
          arguments: JSON.stringify({ target: '/tmp/demo', dryRun: true }),
          seq: nextSeq(),
          view: { preview: '服务端下发的 view', files: ['a.ts'] }
        }
      },
      { type: 'delay', ms: 700 },
      {
        type: 'emit',
        event: {
          type: 'tool/result',
          callId,
          status: 'success',
          result: JSON.stringify({ ok: true, scanned: 3 }),
          seq: nextSeq(),
          view: { preview: '执行完成', files: ['a.ts', 'b.ts'] }
        }
      }
    ]
  }

  const questionSteps = (): DemoStep[] => {
    const rpcId = nextId('rpc-q')
    return [
      {
        type: 'emit',
        event: {
          type: 'question/requested',
          rpcId,
          questions: [
            { question: '接下来更关心哪一块？', options: ['工具卡片', '审批横幅', '作业条'] }
          ]
        }
      },
      { type: 'wait', rpcId, kind: 'question' }
    ]
  }

  const approvalSteps = (): DemoStep[] => {
    const rpcId = nextId('rpc-ap')
    const approvalId = nextId('ap')
    return [
      {
        type: 'emit',
        event: {
          type: 'approval/requested',
          approvalId,
          toolName: 'host.danger',
          reason: '服务端请求执行一次无 callId 的敏感操作',
          rpcId
        }
      },
      { type: 'wait', rpcId, kind: 'approval', approvalId }
    ]
  }

  const jobsStart = (): DemoStep => ({
    type: 'emit',
    event: {
      type: 'jobs/snapshot',
      jobs: [
        { id: 'job-scan', kind: 'bash', label: '扫描仓库', status: 'running' },
        { id: 'job-docs', kind: 'web', label: '拉取文档', status: 'running' }
      ]
    }
  })

  const jobsDone = (): DemoStep => ({
    type: 'emit',
    event: {
      type: 'jobs/snapshot',
      jobs: [
        { id: 'job-scan', kind: 'bash', label: '扫描仓库', status: 'done' },
        { id: 'job-docs', kind: 'web', label: '拉取文档', status: 'done' }
      ]
    }
  })

  const closing = (assistantId: string, content: string): DemoStep[] => [
    {
      type: 'emit',
      event: { type: 'assistant/message', messageId: assistantId, seq: nextSeq(), content }
    },
    { type: 'emit', event: { type: 'jobs/snapshot', jobs: [] } },
    { type: 'emit', event: { type: 'running', running: false } },
    { type: 'emit', event: { type: 'finish' } }
  ]

  const buildSteps = (content: string): DemoStep[] => {
    const kind = pickDemo(content)
    const userId = nextId('user')
    const assistantId = nextId('asst')
    const head: DemoStep[] = [
      { type: 'emit', event: { type: 'user/message', messageId: userId, seq: nextSeq(), content } },
      { type: 'emit', event: { type: 'running', running: true } }
    ]

    if (kind === 'tool') {
      return [
        ...head,
        ...toolSteps(assistantId),
        ...closing(assistantId, '未知工具卡片已走完 pending → success。')
      ]
    }
    if (kind === 'question') {
      return [
        ...head,
        ...questionSteps(),
        ...closing(assistantId, '已收到作答（session.respond，未走 resolveAskQuestion）。')
      ]
    }
    if (kind === 'approval') {
      return [...head, ...approvalSteps(), ...closing(assistantId, '无 callId 的审批横幅已处理。')]
    }
    if (kind === 'jobs') {
      return [
        ...head,
        jobsStart(),
        { type: 'delay', ms: 900 },
        jobsDone(),
        ...closing(assistantId, '作业条已从进行中变为完成。')
      ]
    }

    return [
      ...head,
      jobsStart(),
      { type: 'delay', ms: 360 },
      ...toolSteps(assistantId),
      { type: 'delay', ms: 240 },
      ...questionSteps(),
      { type: 'delay', ms: 240 },
      ...approvalSteps(),
      jobsDone(),
      ...closing(
        assistantId,
        '已演示未知工具卡、提问、无 callId 审批横幅和作业条。本页不接真实 DSH。'
      )
    ]
  }

  return {
    subscribe(handlers) {
      listener = handlers
      return () => {
        listener = undefined
      }
    },
    async send(content) {
      gen += 1
      const token = gen
      invalidate()
      void runSteps(token, buildSteps(content))
    },
    async cancel() {
      gen += 1
      invalidate()
      emit({ type: 'running', running: false })
      emit({ type: 'finish' })
    },
    async respond(rpcId, ok) {
      const waiter = waiters.get(rpcId)
      if (!waiter) return
      waiters.delete(rpcId)
      if (waiter.kind === 'question') {
        emit({
          type: 'question/resolved',
          questionRpcId: rpcId,
          outcome: ok ? 'answered' : 'cancelled'
        })
      } else {
        emit({
          type: 'approval/resolved',
          approvalId: waiter.approvalId ?? rpcId,
          outcome: ok ? 'approved' : 'rejected'
        })
      }
      waiter.done()
    },
    async fetchHistory() {
      return { events: [], hasMore: false }
    },
    async selectModel() {}
  }
}
