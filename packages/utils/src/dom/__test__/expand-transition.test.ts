import { describe, expect, it, vi } from 'vitest'

import { ExpandTransition } from '../expand-transition'

function createPanel() {
  const el = document.createElement('div')

  el.style.paddingTop = '2px'
  el.style.paddingBottom = '2px'
  document.body.appendChild(el)

  Object.defineProperties(el, {
    offsetHeight: { configurable: true, value: 16 },
    scrollHeight: { configurable: true, value: 44 }
  })

  return el
}

function fireHeightTransitionEnd(el: HTMLElement) {
  const event = new Event('transitionend') as TransitionEvent
  Object.defineProperty(event, 'propertyName', { configurable: true, value: 'height' })
  el.dispatchEvent(event)
}

describe('ExpandTransition', () => {
  it('drives Vue transition hooks with a measured border-box height', () => {
    const el = createPanel()
    const transition = new ExpandTransition({
      enterTransition: 'height 0.25s ease, padding-top 0.25s ease, padding-bottom 0.25s ease',
      leaveTransition: 'height 0.2s ease, padding-top 0.2s ease, padding-bottom 0.2s ease',
      opacity: true
    })

    try {
      transition.enter(el)

      expect(el.style.height).toBe('44px')
      expect(el.style.paddingTop).toBe('2px')
      expect(el.style.paddingBottom).toBe('2px')
      expect(el.style.boxSizing).toBe('border-box')
      expect(el.style.opacity).toBe('1')

      transition.beforeLeave(el)
      transition.leave(el)

      expect(el.style.height).toBe('0px')
      expect(el.style.paddingTop).toBe('0px')
      expect(el.style.paddingBottom).toBe('0px')
      expect(el.style.boxSizing).toBe('border-box')
      expect(el.style.opacity).toBe('0')
    } finally {
      el.remove()
    }
  })

  it('keeps expanded imperative panels at auto height after transition end', () => {
    const el = createPanel()
    const transition = new ExpandTransition({ transition: 'height 0.25s ease' })

    try {
      transition.expand(el)

      expect(el.style.height).toBe('44px')
      expect(el.style.overflow).toBe('hidden')

      fireHeightTransitionEnd(el)

      expect(el.style.height).toBe('auto')
      expect(el.style.transition).toBe('')
      expect(el.style.willChange).toBe('')
    } finally {
      el.remove()
      transition.cancel(el)
    }
  })

  it('keeps collapsed imperative panels at zero height after transition end', () => {
    const el = createPanel()
    const transition = new ExpandTransition({ transition: 'height 0.25s ease' })

    try {
      transition.collapse(el)

      expect(el.style.height).toBe('0px')
      expect(el.style.paddingTop).toBe('0px')
      expect(el.style.paddingBottom).toBe('0px')

      fireHeightTransitionEnd(el)

      expect(el.style.height).toBe('0px')
      expect(el.style.transition).toBe('')
      expect(el.style.willChange).toBe('')
    } finally {
      el.remove()
      transition.cancel(el)
    }
  })

  it('invokes onEnd after the transition settles', () => {
    const el = createPanel()
    const transition = new ExpandTransition({ transition: 'height 0.25s ease' })
    const onEnd = vi.fn()

    try {
      transition.collapse(el, onEnd)
      expect(onEnd).not.toHaveBeenCalled()

      fireHeightTransitionEnd(el)
      expect(onEnd).toHaveBeenCalledTimes(1)
    } finally {
      el.remove()
      transition.cancel(el)
    }
  })

  it('does not invoke onEnd when interrupted by a new animation', () => {
    const el = createPanel()
    const transition = new ExpandTransition({ transition: 'height 0.25s ease' })
    const onEnd = vi.fn()

    try {
      transition.collapse(el, onEnd)
      // 新动画打断旧动画：旧 onEnd 不应再触发
      transition.expand(el)
      fireHeightTransitionEnd(el)
      expect(onEnd).not.toHaveBeenCalled()
    } finally {
      el.remove()
      transition.cancel(el)
    }
  })

  it('invokes onEnd immediately when no animation is needed', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const transition = new ExpandTransition({ transition: 'height 0.25s ease' })
    const onEnd = vi.fn()

    try {
      // 高度已为 0（happy-dom 无布局），收起无需动画，onEnd 同步调用
      transition.collapse(el, onEnd)
      expect(onEnd).toHaveBeenCalledTimes(1)
    } finally {
      el.remove()
      transition.cancel(el)
    }
  })
})
