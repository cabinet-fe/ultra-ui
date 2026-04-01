import { removeStyles, setStyles } from '@ui/utils'

interface UseMenuTransitionReturned {
  enter: (el: HTMLElement) => void
  afterEnter: (el: HTMLElement) => void
  beforeLeave: (el: HTMLElement) => void
  leave: (el: HTMLElement) => void
  afterLeave: (el: HTMLElement) => void
}

const transitionEnter =
  'height 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding-top 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s cubic-bezier(0.4, 0, 0.2, 1)'

const transitionLeave =
  'height 0.2s cubic-bezier(0.4, 0, 1, 1), padding-top 0.2s cubic-bezier(0.4, 0, 1, 1), opacity 0.12s cubic-bezier(0.4, 0, 1, 1)'

export function useMenuTransition(): UseMenuTransitionReturned {
  function resetStyles(el: HTMLElement) {
    removeStyles(el, ['height', 'padding-top', 'overflow', 'transition', 'opacity', 'will-change'])
  }

  function enter(el: HTMLElement) {
    const height = el.scrollHeight
    const paddingTop = getComputedStyle(el).paddingTop

    setStyles(el as HTMLElement, {
      height: 0,
      paddingTop: 0,
      overflow: 'hidden',
      opacity: 0,
      transition: transitionEnter,
      willChange: 'height, opacity'
    })

    requestAnimationFrame(() => {
      setStyles(el, {
        height: `${height}px`,
        paddingTop,
        opacity: 1
      })
    })
  }

  function afterEnter(el: HTMLElement) {
    resetStyles(el)
  }

  function beforeLeave(el: HTMLElement) {
    const paddingTop = getComputedStyle(el).paddingTop

    setStyles(el, {
      height: `${el.scrollHeight}px`,
      paddingTop,
      overflow: 'hidden',
      opacity: 1,
      transition: transitionLeave,
      willChange: 'height, opacity'
    })
  }

  function leave(el: HTMLElement) {
    // 强制刷新，避免收起时浏览器合并样式导致动画缺失
    void el.offsetHeight

    setStyles(el, {
      height: 0,
      paddingTop: 0,
      opacity: 0
    })
  }

  function afterLeave(el: HTMLElement) {
    resetStyles(el)
  }

  return {
    enter,
    afterEnter,
    beforeLeave,
    leave,
    afterLeave
  }
}
