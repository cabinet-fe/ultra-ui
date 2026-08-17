import { removeStyles, setStyles } from './style'

export interface ExpandTransitionOptions {
  transition?: string
  enterTransition?: string
  leaveTransition?: string
  opacity?: boolean
}

function readVerticalPadding(el: HTMLElement) {
  const { paddingTop, paddingBottom } = getComputedStyle(el)
  return { paddingTop, paddingBottom }
}

function getTransition(options: ExpandTransitionOptions, type: 'enter' | 'leave') {
  return (
    (type === 'enter' ? options.enterTransition : options.leaveTransition) ??
    options.transition ??
    'height 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
  )
}

export class ExpandTransition {
  private cleanupMap = new Map<HTMLElement, () => void>()

  constructor(private options: ExpandTransitionOptions = {}) {}

  cancel(el: HTMLElement) {
    this.cleanupMap.get(el)?.()
    this.cleanupMap.delete(el)
  }

  enter(el: HTMLElement) {
    const height = el.scrollHeight
    const { paddingTop, paddingBottom } = readVerticalPadding(el)

    setStyles(el, {
      boxSizing: 'border-box',
      height: 0,
      paddingTop: 0,
      paddingBottom: 0,
      overflow: 'hidden',
      transition: getTransition(this.options, 'enter'),
      willChange: this.options.opacity ? 'height, opacity' : 'height'
    })

    if (this.options.opacity) {
      el.style.opacity = '0'
    }

    void el.offsetHeight

    setStyles(el, { height: `${height}px`, paddingTop, paddingBottom })

    if (this.options.opacity) {
      el.style.opacity = '1'
    }
  }

  afterEnter(el: HTMLElement) {
    this.resetTransitionStyles(el)
  }

  beforeLeave(el: HTMLElement) {
    const { paddingTop, paddingBottom } = readVerticalPadding(el)

    setStyles(el, {
      boxSizing: 'border-box',
      height: `${el.scrollHeight}px`,
      paddingTop,
      paddingBottom,
      overflow: 'hidden',
      transition: getTransition(this.options, 'leave'),
      willChange: this.options.opacity ? 'height, opacity' : 'height'
    })

    if (this.options.opacity) {
      el.style.opacity = '1'
    }
  }

  leave(el: HTMLElement) {
    void el.offsetHeight

    setStyles(el, { height: 0, paddingTop: 0, paddingBottom: 0 })

    if (this.options.opacity) {
      el.style.opacity = '0'
    }
  }

  afterLeave(el: HTMLElement) {
    this.resetTransitionStyles(el)
  }

  /**
   * 展开动画；`onEnd` 在动画落定（含无需动画直接落定）后调用，
   * 被新的动画打断时不调用
   */
  expand(el: HTMLElement, onEnd?: () => void) {
    this.animate(el, true, onEnd)
  }

  /** 收起动画；`onEnd` 语义同 `expand` */
  collapse(el: HTMLElement, onEnd?: () => void) {
    this.animate(el, false, onEnd)
  }

  setExpanded(el: HTMLElement, expanded: boolean) {
    this.cancel(el)
    this.resetTemporaryStyles(el)
    el.style.overflow = 'hidden'
    el.style.height = expanded ? 'auto' : '0px'
  }

  private animate(el: HTMLElement, expanded: boolean, onEnd?: () => void) {
    this.cancel(el)

    const startHeight = el.offsetHeight
    const endHeight = expanded ? el.scrollHeight : 0
    const { paddingTop, paddingBottom } = readVerticalPadding(el)

    if (startHeight === endHeight) {
      this.setExpanded(el, expanded)
      onEnd?.()
      return
    }

    setStyles(el, {
      boxSizing: 'border-box',
      height: `${startHeight}px`,
      paddingTop,
      paddingBottom,
      overflow: 'hidden',
      transition: getTransition(this.options, expanded ? 'enter' : 'leave'),
      willChange: 'height'
    })

    void el.offsetHeight

    setStyles(el, {
      height: `${endHeight}px`,
      paddingTop: expanded ? paddingTop : 0,
      paddingBottom: expanded ? paddingBottom : 0
    })

    const cleanup = () => {
      el.removeEventListener('transitionend', onEndHandler)
      el.removeEventListener('transitioncancel', onEndHandler)
      this.cleanupMap.delete(el)
    }

    const onEndHandler = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== 'height') return
      cleanup()
      this.resetTemporaryStyles(el)
      el.style.overflow = 'hidden'
      el.style.height = expanded ? 'auto' : '0px'
      onEnd?.()
    }

    el.addEventListener('transitionend', onEndHandler)
    el.addEventListener('transitioncancel', onEndHandler)
    this.cleanupMap.set(el, cleanup)
  }

  private resetTransitionStyles(el: HTMLElement) {
    removeStyles(el, [
      'box-sizing',
      'height',
      'padding-top',
      'padding-bottom',
      'overflow',
      'transition',
      'opacity',
      'will-change'
    ])
  }

  private resetTemporaryStyles(el: HTMLElement) {
    removeStyles(el, [
      'box-sizing',
      'padding-top',
      'padding-bottom',
      'transition',
      'opacity',
      'will-change'
    ])
  }
}
