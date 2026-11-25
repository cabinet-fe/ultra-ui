// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h } from 'vue'

import { UAiApprovalBanner } from '..'
import type { ChatPendingApproval } from '../../../chat/fold'
import type { AiApprovalBannerProps } from '../../../types'

let warnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  const injectionWarnings = warnSpy.mock.calls.filter((args) =>
    args.some(
      (arg) => typeof arg === 'string' && (arg.includes('injection') || arg.includes('AiChatDIKey'))
    )
  )
  expect(injectionWarnings).toEqual([])
  warnSpy.mockRestore()
})

function mountBanner(props: AiApprovalBannerProps & Record<string, unknown>) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(UAiApprovalBanner, props) })
  app.mount(host)
  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

const APPROVALS: ChatPendingApproval[] = [
  { approvalId: 'a1', toolName: 'bash', callId: 'c1', reason: '绑定调用的审批', rpcId: 'rpc-1' },
  { approvalId: 'a2', toolName: 'deploy', reason: '发布生产环境', rpcId: 'rpc-2' },
  { approvalId: 'a3', toolName: 'migrate', rpcId: 'rpc-3' }
]

describe('UAiApprovalBanner', () => {
  it('默认 filterUnlinked: true 过滤带 callId 的审批项，全部绑定 callId 时不渲染', () => {
    const onlyLinked = mountBanner({ approvals: [APPROVALS[0]!] })
    expect(onlyLinked.host.querySelector('.u-ai-approval-banner')).toBeFalsy()
    onlyLinked.unmount()

    const { host, unmount } = mountBanner({ approvals: APPROVALS })
    const cards = host.querySelectorAll('.u-ai-approval-banner__card')
    expect(cards).toHaveLength(2)
    expect(cards[0]?.querySelector('.u-ai-approval-banner__reason')?.textContent?.trim()).toBe(
      '发布生产环境'
    )
    expect(cards[1]?.querySelector('.u-ai-approval-banner__reason')?.textContent?.trim()).toBe(
      'migrate'
    )
    unmount()
  })

  it('filterUnlinked: false 时全量展示并正确触发 respond(rpcId, approved)', () => {
    const onRespond = vi.fn()
    const { host, unmount } = mountBanner({
      approvals: APPROVALS,
      filterUnlinked: false,
      onRespond
    })

    const cards = host.querySelectorAll<HTMLElement>('.u-ai-approval-banner__card')
    expect(cards).toHaveLength(3)

    const btns0 = [...cards[0]!.querySelectorAll<HTMLElement>('button')]
    btns0.find((b) => b.textContent?.includes('允许'))!.click()
    expect(onRespond).toHaveBeenCalledWith('rpc-1', true)

    const btns1 = [...cards[1]!.querySelectorAll<HTMLElement>('button')]
    btns1.find((b) => b.textContent?.includes('拒绝'))!.click()
    expect(onRespond).toHaveBeenCalledWith('rpc-2', false)
    unmount()
  })
})
