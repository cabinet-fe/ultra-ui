import { removeStyles, setStyles } from '@ui/utils'

export function useMenuTransition() {
  // cubic-bezier(0.25, 1, 0.5, 1)
  const enterTransition = 'height 0.3s ease'
  const leaveTransition = enterTransition

  function enter(el: HTMLElement) {
    // 插入时获取高度
    const height = el.offsetHeight
    setStyles(el as HTMLElement, {
      height: 0,
      transition: enterTransition
    })

    requestAnimationFrame(() => {
      setStyles(el, {
        height: `${height}px`
      })
    })
  }

  function afterEnter(el: HTMLElement) {
    removeStyles(el, ['transition', 'height'])
  }

  function beforeLeave(el: HTMLElement) {
    setStyles(el, {
      height: el.offsetHeight + 'px',
      transition: leaveTransition
    })
  }

  function leave(el: HTMLElement) {
    setStyles(el, {
      height: 0
    })
  }

  function afterLeave(el: HTMLElement) {
    removeStyles(el, ['transition', 'height'])
  }

  return {
    enter,
    afterEnter,
    beforeLeave,
    leave,
    afterLeave
  }
}
