// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h } from 'vue'

import { UAiMessageQueue } from '..'
import type { ChatQueuedMessage } from '../../../chat/types'
import type { AiMessageQueueProps } from '../../../types'

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

function mountQueue(props: AiMessageQueueProps & Record<string, unknown>) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(UAiMessageQueue, props) })
  app.mount(host)
  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

const SAMPLE_QUEUE: ChatQueuedMessage[] = [
  { id: 'q1', content: '先优化性能' },
  { id: 'q2', content: '再补充单元测试' }
]

describe('UAiMessageQueue', () => {
  it('空队列不渲染，非空时展示队列头计数与每项文案', () => {
    const empty = mountQueue({ queue: [] })
    expect(empty.host.querySelector('.u-ai-message-queue')).toBeFalsy()
    empty.unmount()

    const { host, unmount } = mountQueue({ queue: SAMPLE_QUEUE })
    expect(host.querySelector('.u-ai-message-queue__head')?.textContent).toBe('待发送队列 · 2')
    const texts = [...host.querySelectorAll('.u-ai-message-queue__text')].map(
      (el) => el.textContent
    )
    expect(texts).toEqual(['先优化性能', '再补充单元测试'])
    unmount()
  })

  it('点击操作按钮触发 start-now / edit / remove 事件', () => {
    const onStartNow = vi.fn()
    const onEdit = vi.fn()
    const onRemove = vi.fn()
    const { host, unmount } = mountQueue({ queue: SAMPLE_QUEUE, onStartNow, onEdit, onRemove })

    const items = host.querySelectorAll<HTMLElement>('.u-ai-message-queue__item')
    const startBtn = [
      ...items[0]!.querySelectorAll<HTMLElement>('.u-ai-message-queue__action')
    ].find((b) => b.textContent?.includes('立即开始'))!
    startBtn.click()
    expect(onStartNow).toHaveBeenCalledWith('q1')

    items[1]!.querySelector<HTMLElement>('[title="取回输入框编辑"]')!.click()
    expect(onEdit).toHaveBeenCalledWith('q2')

    items[0]!.querySelector<HTMLElement>('[title="移出队列"]')!.click()
    expect(onRemove).toHaveBeenCalledWith('q1')
    unmount()
  })

  it('readonly 为 true 时隐藏操作按钮区', () => {
    const { host, unmount } = mountQueue({ queue: SAMPLE_QUEUE, readonly: true })
    expect(host.querySelector('.u-ai-message-queue')).toBeTruthy()
    expect(host.querySelector('.u-ai-message-queue__actions')).toBeFalsy()
    unmount()
  })
})
