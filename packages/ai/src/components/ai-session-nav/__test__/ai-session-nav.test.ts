// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, h, nextTick } from 'vue'

import { UAiSessionNav } from '..'
import type { AiSessionNavItem, AiSessionNavProps } from '../../../types'

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

function mountNav(props: AiSessionNavProps & Record<string, unknown>) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const app = createApp({ render: () => h(UAiSessionNav, props) })
  app.mount(host)
  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    }
  }
}

const ITEMS: AiSessionNavItem[] = [
  { key: 't1', index: 0, question: '第一轮问题', answer: '第一轮答复' },
  { key: 't2', index: 1, question: '第二轮问题' },
  { key: 't3', index: 2, question: '第三轮问题', answer: '第三轮答复' }
]

describe('UAiSessionNav', () => {
  it('按 minItems 与 scrollable 条件显隐', () => {
    const tooFew = mountNav({ items: ITEMS.slice(0, 2), scrollable: true })
    expect(tooFew.host.querySelector('.u-ai-session-nav')).toBeFalsy()
    tooFew.unmount()

    const notScrollable = mountNav({ items: ITEMS, scrollable: false })
    expect(notScrollable.host.querySelector('.u-ai-session-nav')).toBeFalsy()
    notScrollable.unmount()

    const customMin = mountNav({ items: ITEMS.slice(0, 2), minItems: 2, scrollable: true })
    expect(customMin.host.querySelector('.u-ai-session-nav')).toBeTruthy()
    expect(customMin.host.querySelectorAll('.u-ai-session-nav__dot')).toHaveLength(2)
    customMin.unmount()
  })

  it('高亮 activeKey 与已读态 is-read，hover 展示 tooltip，点击触发 jump', async () => {
    const onJump = vi.fn()
    const { host, unmount } = mountNav({ items: ITEMS, activeKey: 't2', scrollable: true, onJump })

    const dots = [...host.querySelectorAll<HTMLElement>('.u-ai-session-nav__dot')]
    expect(dots[0]?.classList.contains('is-read')).toBe(true)
    expect(dots[0]?.classList.contains('is-active')).toBe(false)
    expect(dots[1]?.classList.contains('is-active')).toBe(true)
    expect(dots[1]?.classList.contains('is-read')).toBe(false)
    expect(dots[2]?.classList.contains('is-active')).toBe(false)
    expect(dots[2]?.classList.contains('is-read')).toBe(false)

    // hover 第 1 项显示问/答 tooltip
    const navItems = host.querySelectorAll<HTMLElement>('.u-ai-session-nav__item')
    navItems[0]!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }))
    await nextTick()
    const tip1 = host.querySelector('.u-ai-session-nav__tooltip')!
    expect(tip1.querySelector('.u-ai-session-nav__tooltip-q')?.textContent).toBe('第一轮问题')
    expect(tip1.querySelector('.u-ai-session-nav__tooltip-a')?.textContent).toBe('第一轮答复')

    navItems[0]!.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }))
    await nextTick()
    expect(host.querySelector('.u-ai-session-nav__tooltip')).toBeFalsy()

    // hover 无 answer 项只展示提问行
    navItems[1]!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }))
    await nextTick()
    const tip2 = host.querySelector('.u-ai-session-nav__tooltip')!
    expect(tip2.querySelector('.u-ai-session-nav__tooltip-q')?.textContent).toBe('第二轮问题')
    expect(tip2.querySelector('.u-ai-session-nav__tooltip-a')).toBeFalsy()

    // 点击圆点触发 jump
    dots[2]!.click()
    expect(onJump).toHaveBeenCalledWith('t3')
    unmount()
  })
})
