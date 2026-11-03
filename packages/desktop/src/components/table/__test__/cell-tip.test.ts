// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp } from 'vue'

import { useCellTip } from '../use-cell-tip'

let tip: ReturnType<typeof useCellTip>
let app: ReturnType<typeof createApp>

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  app?.unmount()
  document.body.innerHTML = ''
})

/** 挂载 hook 并返回一个单元格与悬停函数 */
function setup(text = '很长很长很长的文本', options?: { delay?: number; enabled?: () => boolean }) {
  const cell = document.createElement('td')
  cell.className = 'u-table__cell'
  cell.textContent = text
  document.body.appendChild(cell)

  const host = document.createElement('div')
  document.body.appendChild(host)
  app = createApp({
    setup() {
      tip = useCellTip({
        cellSelector: '.u-table__cell',
        enabled: options?.enabled ?? (() => true),
        delay: options?.delay ?? 0
      })
      return () => null
    }
  })
  app.mount(host)

  const hover = () => {
    const e = new MouseEvent('mouseover')
    Object.defineProperty(e, 'target', { value: cell })
    tip.handleMouseover(e)
  }

  return { cell, hover, tip }
}

describe('useCellTip', () => {
  it('悬停单元格时展示完整文本', () => {
    const { cell, hover, tip } = setup()
    hover()

    expect(tip.visible.value).toBe(true)
    expect(tip.trigger.value).toBe(cell)
    expect(tip.content.value).toBe('很长很长很长的文本')
  })

  it('跨列单元格（展开行）不展示提示', () => {
    const { cell, hover, tip } = setup()
    Object.defineProperty(cell, 'colSpan', { value: 3 })
    hover()

    expect(tip.visible.value).toBe(false)
  })

  it('提示横向对齐跟随单元格的列对齐', () => {
    for (const [cls, expected] of [
      ['is-left', 'start'],
      ['is-center', 'center'],
      ['is-right', 'end']
    ] as const) {
      const { cell, hover, tip } = setup()
      cell.className = `u-table__cell ${cls}`
      hover()
      expect(tip.align.value).toBe(expected)
      app.unmount()
      document.body.innerHTML = ''
    }
  })

  it('未启用时完全不响应', () => {
    const { hover, tip } = setup('很长很长很长的文本', { enabled: () => false })
    hover()

    expect(tip.visible.value).toBe(false)
  })

  it('鼠标移出表格时收起提示', () => {
    const { hover, tip } = setup()
    hover()
    expect(tip.visible.value).toBe(true)

    tip.handleMouseleave()
    expect(tip.visible.value).toBe(false)
  })

  it('延迟到期后才弹出，延迟期间离开则不弹', () => {
    vi.useFakeTimers()
    const { hover, tip } = setup('很长很长很长的文本', { delay: 200 })

    hover()
    expect(tip.visible.value).toBe(false)
    vi.advanceTimersByTime(200)
    expect(tip.visible.value).toBe(true)

    tip.handleMouseleave()
    hover()
    vi.advanceTimersByTime(100)
    tip.handleMouseleave()
    vi.advanceTimersByTime(200)
    expect(tip.visible.value).toBe(false)

    vi.useRealTimers()
  })
})
