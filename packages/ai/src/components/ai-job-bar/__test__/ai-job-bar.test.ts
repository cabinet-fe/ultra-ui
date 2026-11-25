// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, defineComponent, h, nextTick } from 'vue'

import { UAiJobBar } from '..'
import type { ChatJob } from '../../../chat/types'
import type { AiJobBarProps } from '../../../types'

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

function mountJobBar(props: AiJobBarProps) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(UAiJobBar, props) })
  app.mount(host)
  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

const JOBS: ChatJob[] = [
  { id: 'j1', kind: 'bash', label: '运行构建', status: 'running' },
  { id: 'j2', kind: 'custom-job', label: '生成索引', status: 'done' },
  { id: 'j3', kind: 'web', label: '抓取页面', status: 'error' }
]

describe('UAiJobBar', () => {
  it('空 jobs 不渲染，默认展开并展示状态点与进行中 u-shine 扫光', async () => {
    const empty = mountJobBar({ jobs: [] })
    expect(empty.host.querySelector('.u-ai-job-bar')).toBeFalsy()
    empty.unmount()

    const { host, unmount } = mountJobBar({ jobs: JOBS })
    expect(host.querySelector('.u-ai-job-bar__head')?.textContent).toContain('作业 · 3')
    expect(host.querySelectorAll('.u-ai-job-bar__item')).toHaveLength(3)

    const labels = [...host.querySelectorAll('.u-ai-job-bar__label')]
    expect(labels[0]?.classList.contains('u-shine')).toBe(true)
    expect(labels[1]?.classList.contains('u-shine')).toBe(false)

    expect(host.querySelectorAll('.u-ai-job-bar__dot.is-running')).toHaveLength(1)
    expect(host.querySelectorAll('.u-ai-job-bar__dot.is-done')).toHaveLength(1)
    expect(host.querySelectorAll('.u-ai-job-bar__dot.is-error')).toHaveLength(1)

    // 点击头部折叠与再展开
    const head = host.querySelector<HTMLElement>('.u-ai-job-bar__head')!
    head.click()
    await nextTick()
    expect(host.querySelector('.u-ai-job-bar__list')).toBeFalsy()
    head.click()
    await nextTick()
    expect(host.querySelector('.u-ai-job-bar__list')).toBeTruthy()
    unmount()
  })

  it('支持 defaultExpanded: false 与 toolIcons 图标映射覆盖', async () => {
    const CustomJobIcon = defineComponent({
      setup: () => () => h('svg', { class: 'custom-job-icon' })
    })
    const { host, unmount } = mountJobBar({
      jobs: JOBS,
      defaultExpanded: false,
      toolIcons: { 'custom-job': CustomJobIcon }
    })

    expect(host.querySelector('.u-ai-job-bar__list')).toBeFalsy()
    host.querySelector<HTMLElement>('.u-ai-job-bar__head')!.click()
    await nextTick()
    expect(host.querySelector('.u-ai-job-bar__list')).toBeTruthy()
    expect(host.querySelector('.custom-job-icon')).toBeTruthy()
    unmount()
  })
})
