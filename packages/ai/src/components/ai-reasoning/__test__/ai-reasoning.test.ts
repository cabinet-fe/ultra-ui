// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick, ref } from 'vue'

import { UAiReasoning } from '..'
import type { AiReasoningProps } from '../../../types'

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

function mountReasoning(props: AiReasoningProps, slots?: Record<string, () => any>) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(UAiReasoning, props, slots) })
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

describe('UAiReasoning', () => {
  it('默认折叠且无内容 DOM，点击头部展开与收起，支持 defaultExpanded 与默认插槽', async () => {
    const collapsed = mountReasoning({ content: '推理详情' })
    expect(collapsed.host.querySelector('.u-ai-reasoning__title')?.textContent).toBe('思考过程')
    expect(collapsed.host.querySelector('.u-ai-reasoning__content')).toBeFalsy()

    collapsed.host.querySelector<HTMLElement>('.u-ai-reasoning__header')!.click()
    await nextTick()
    expect(collapsed.host.querySelector('.u-ai-reasoning.is-expanded')).toBeTruthy()
    expect(collapsed.host.querySelector('.u-ai-reasoning__text')?.textContent).toBe('推理详情')

    collapsed.host.querySelector<HTMLElement>('.u-ai-reasoning__header')!.click()
    await nextTick()
    expect(collapsed.host.querySelector('.u-ai-reasoning__content')).toBeFalsy()
    collapsed.unmount()

    const expanded = mountReasoning(
      { content: '默认文本', defaultExpanded: true },
      { default: () => h('span', { class: 'custom-reasoning' }, '自定义思考渲染') }
    )
    expect(expanded.host.querySelector('.u-ai-reasoning.is-expanded')).toBeTruthy()
    expect(expanded.host.querySelector('.custom-reasoning')?.textContent).toBe('自定义思考渲染')
    expanded.unmount()
  })

  it('thinking 状态显示「思考中…」与折叠态最新一行，显式 duration 亚秒不报耗时', async () => {
    const thinkingMount = mountReasoning({
      content: '第一行思考\n\n最后一行思考\n',
      thinking: true
    })
    expect(thinkingMount.host.querySelector('.u-ai-reasoning__title')?.textContent).toBe('思考中…')
    expect(
      thinkingMount.host.querySelector('.u-ai-reasoning__title')?.classList.contains('u-shine')
    ).toBe(true)
    expect(thinkingMount.host.querySelector('.u-ai-thinking-icon.is-active')).toBeTruthy()
    expect(thinkingMount.host.querySelector('.u-ai-reasoning__line')?.textContent).toBe(
      '最后一行思考'
    )

    // 展开后头部右侧最新一行隐藏
    thinkingMount.host.querySelector<HTMLElement>('.u-ai-reasoning__header')!.click()
    await nextTick()
    expect(thinkingMount.host.querySelector('.u-ai-reasoning__line')).toBeFalsy()
    thinkingMount.unmount()

    const subSecond = mountReasoning({ content: '很快', duration: 600 })
    expect(subSecond.host.querySelector('.u-ai-reasoning__title')?.textContent).toBe('思考过程')
    subSecond.unmount()

    const longDuration = mountReasoning({ content: '很久', duration: 4200 })
    expect(longDuration.host.querySelector('.u-ai-reasoning__title')?.textContent).toBe('思考了 4s')
    longDuration.unmount()
  })

  it('cacheKey 自动计时并在跨实例卸载重挂载后还原耗时', async () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date']
    })
    try {
      const thinking = ref(true)
      const cacheKey = 'standalone-reasoning-cache-key'

      const host1 = document.createElement('div')
      document.body.appendChild(host1)
      const app1 = createApp({
        render: () => h(UAiReasoning, { content: '深度推理', thinking: thinking.value, cacheKey })
      })
      app1.mount(host1)

      expect(host1.querySelector('.u-ai-reasoning__title')?.textContent).toBe('思考中…')
      await vi.advanceTimersByTimeAsync(2200)

      thinking.value = false
      await nextTick()
      expect(host1.querySelector('.u-ai-reasoning__title')?.textContent).toBe('思考了 2s')

      // 卸载原实例，重新挂载相同 cacheKey 的新实例
      app1.unmount()
      host1.remove()

      const host2 = document.createElement('div')
      document.body.appendChild(host2)
      const app2 = createApp({
        render: () => h(UAiReasoning, { content: '深度推理', thinking: false, cacheKey })
      })
      app2.mount(host2)
      expect(host2.querySelector('.u-ai-reasoning__title')?.textContent).toBe('思考了 2s')
      app2.unmount()
      host2.remove()

      // 无 cacheKey 或不同 cacheKey 的新实例不读取前一个缓存
      const host3 = document.createElement('div')
      document.body.appendChild(host3)
      const app3 = createApp({
        render: () =>
          h(UAiReasoning, { content: '其他推理', thinking: false, cacheKey: 'other-key' })
      })
      app3.mount(host3)
      expect(host3.querySelector('.u-ai-reasoning__title')?.textContent).toBe('思考过程')
      app3.unmount()
      host3.remove()
    } finally {
      vi.useRealTimers()
    }
  })
})
