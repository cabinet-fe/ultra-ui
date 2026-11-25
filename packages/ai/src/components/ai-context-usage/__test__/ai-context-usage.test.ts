// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick } from 'vue'

import { UAiContextUsage } from '..'
import type { AiContextUsageProps } from '../../../types'

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

function mountUsage(props: AiContextUsageProps, slots?: Record<string, (scope: any) => any>) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(UAiContextUsage, props, slots) })
  app.mount(host)

  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

async function openPanel(host: HTMLElement) {
  const trigger = host.querySelector<HTMLElement>('.u-ai-context-usage__trigger')!
  trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
  await nextTick()
  await nextTick()
  const panel = document.body.querySelector('.u-ai-context-usage__panel')
  const rows: Record<string, string> = {}
  panel?.querySelectorAll('.u-ai-context-usage__row').forEach((row) => {
    const label = row.querySelector('.u-ai-context-usage__label')?.textContent ?? ''
    rows[label] = row.querySelector('.u-ai-context-usage__value')?.textContent ?? ''
  })
  return { panel, rows }
}

describe('UAiContextUsage', () => {
  it('usage 为 null 或 undefined 时不渲染DOM', () => {
    const m1 = mountUsage({ usage: null })
    expect(m1.host.querySelector('.u-ai-context-usage__trigger')).toBeFalsy()
    m1.unmount()

    const m2 = mountUsage({})
    expect(m2.host.querySelector('.u-ai-context-usage__trigger')).toBeFalsy()
    m2.unmount()
  })

  it('无 contextWindow 时展示空环，有 contextWindow 时计算环形占比', async () => {
    // 无 contextWindow
    const noWin = mountUsage({
      usage: { promptTokens: 500, completionTokens: 200, totalTokens: 700 },
      lastRequestUsage: { promptTokens: 500, completionTokens: 200, totalTokens: 700 }
    })
    const emptyRing = noWin.host.querySelector('.u-ai-context-usage__ring-value')!
    expect(emptyRing.getAttribute('stroke-dasharray')).toBe('0 100')
    expect(emptyRing.getAttribute('stroke-linecap')).toBeNull()
    const noWinPanel = await openPanel(noWin.host)
    expect(noWinPanel.rows['上下文占用']).toBeUndefined()
    noWin.unmount()

    // 有 contextWindow
    const withWin = mountUsage({
      usage: { promptTokens: 1200, completionTokens: 300, totalTokens: 1500 },
      lastRequestUsage: { promptTokens: 600, completionTokens: 400, totalTokens: 1000 },
      contextWindow: 10000
    })
    const ring = withWin.host.querySelector('.u-ai-context-usage__ring-value')!
    expect(ring.getAttribute('stroke-dasharray')).toBe('10 100')
    expect(ring.getAttribute('stroke-linecap')).toBe('round')
    const withWinPanel = await openPanel(withWin.host)
    expect(withWinPanel.rows['上下文占用']).toBe('1K / 10K · 10%')
    withWin.unmount()

    // 超过上限封顶 100%
    const capped = mountUsage({
      usage: { promptTokens: 12000, completionTokens: 3000, totalTokens: 15000 },
      lastRequestUsage: { promptTokens: 12000, completionTokens: 3000, totalTokens: 15000 },
      contextWindow: 10000
    })
    expect(
      capped.host.querySelector('.u-ai-context-usage__ring-value')?.getAttribute('stroke-dasharray')
    ).toBe('100 100')
    capped.unmount()
  })

  it('detail 开关控制缓存命中/未命中明细显示与 K/M 缩写', async () => {
    const usage = {
      promptTokens: 800,
      completionTokens: 700,
      totalTokens: 1500,
      cacheHitTokens: 1000,
      cacheMissTokens: 1_500_000
    }

    const compact = mountUsage({ usage, detail: false })
    const compactRows = (await openPanel(compact.host)).rows
    expect(compactRows['总 token']).toBe('1.5K')
    expect(compactRows['输入']).toBe('800')
    expect(compactRows['输出']).toBe('700')
    expect(compactRows['缓存命中']).toBeUndefined()
    expect(compactRows['缓存未命中']).toBeUndefined()
    compact.unmount()

    const detailed = mountUsage({ usage, detail: true })
    const detailRows = (await openPanel(detailed.host)).rows
    expect(detailRows['缓存命中']).toBe('1K')
    expect(detailRows['缓存未命中']).toBe('1.5M')
    detailed.unmount()
  })

  it('支持 #default 作用域插槽自定义明细面板', async () => {
    const usage = { promptTokens: 200, completionTokens: 100, totalTokens: 300 }
    const lastRequestUsage = { promptTokens: 200, completionTokens: 100, totalTokens: 300 }
    const { host, unmount } = mountUsage(
      { usage, lastRequestUsage, contextWindow: 1000 },
      {
        default: (scope) =>
          h(
            'div',
            { class: 'custom-usage-panel' },
            `${scope.contextText}|rows:${scope.rows.length}|pct:${scope.contextPercent}`
          )
      }
    )

    const { panel } = await openPanel(host)
    expect(panel?.querySelector('.u-ai-context-usage__list')).toBeFalsy()
    expect(panel?.querySelector('.custom-usage-panel')?.textContent).toBe(
      '300 / 1K · 30%|rows:3|pct:30'
    )
    unmount()
  })
})
