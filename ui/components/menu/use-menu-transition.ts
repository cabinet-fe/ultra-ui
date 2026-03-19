import { removeStyles, setStyles } from '@ui/utils'

interface UseMenuTransitionReturned {
  enter: (el: HTMLElement) => void
  afterEnter: (el: HTMLElement) => void
  beforeLeave: (el: HTMLElement) => void
  leave: (el: HTMLElement) => void
  afterLeave: (el: HTMLElement) => void
}

export function useMenuTransition(): UseMenuTransitionReturned {
  const transition =
    'height 0.24s cubic-bezier(0.22, 1, 0.36, 1), padding-top 0.24s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease, transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)'

  function resetStyles(el: HTMLElement) {
    removeStyles(el, [
      'height',
      'padding-top',
      'overflow',
      'transition',
      'opacity',
      'transform',
      'will-change'
    ])
  }

  function enter(el: HTMLElement) {
    const height = el.scrollHeight
    const paddingTop = getComputedStyle(el).paddingTop

    setStyles(el as HTMLElement, {
      height: 0,
      paddingTop: 0,
      overflow: 'hidden',
      opacity: 0,
      transform: 'translateY(-2px)',
      transition,
      willChange: 'height, padding-top, opacity, transform'
    })

    requestAnimationFrame(() => {
      setStyles(el, {
        height: `${height}px`,
        paddingTop,
        opacity: 1,
        transform: 'translateY(0)'
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
      transform: 'translateY(0)',
      transition,
      willChange: 'height, padding-top, opacity, transform'
    })
  }

  function leave(el: HTMLElement) {
    // 强制刷新，避免收起时浏览器合并样式导致动画缺失
    void el.offsetHeight

    setStyles(el, {
      height: 0,
      paddingTop: 0,
      opacity: 0,
      transform: 'translateY(-2px)'
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
