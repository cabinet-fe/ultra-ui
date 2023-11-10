import { isRef, watch, type CSSProperties, onBeforeUnmount } from 'vue'
import type { Returned, TransitionBase } from './type'

interface StyleTransitionOptions extends TransitionBase {
  /** 进入后的样式 */
  enterToStyle: CSSProperties
  /** 进入过渡时的样式 */
  transitionInStyle: CSSProperties
  /** 离开过渡时的样式 */
  transitionOutStyle: CSSProperties
}

export function useStyleTransition(options: StyleTransitionOptions): Returned {
  const {
    enterToStyle,
    transitionInStyle,
    transitionOutStyle,
    target,
    afterEnter,
    afterLeave,
    enterCanceled,
    leaveCanceled
  } = options

  const getDom = (): HTMLElement | undefined =>
    isRef(target) ? target.value : target

  /** 进入动画前的初始状态 */
  const transitionOriginStyle: CSSProperties = {}

  watch(
    () => getDom(),
    dom => {
      if (dom) {
        Object.keys(enterToStyle).forEach(key => {
          transitionOriginStyle[key] = dom.style[key]
        })
        Object.keys(transitionInStyle).forEach(key => {
          transitionOriginStyle[key] = dom.style[key]
        })
      }
    },
    {
      immediate: true
    }
  )

  /**
   * 添加过渡进入时并持续时的样式
   * @param dom 元素
   */
  const addTransitionInStyle = (dom: HTMLElement) => {
    Object.keys(transitionInStyle).forEach(key => {
      dom.style[key] = transitionInStyle[key]
    })
  }

  /**
   * 移除过渡进入时并持续时的样式
   * @param dom 元素
   */
  const removeTransitionInStyle = (dom: HTMLElement) => {
    Object.keys(transitionInStyle).forEach(key => {
      dom.style[key] = transitionOriginStyle[key]
    })
  }

  /**
   * 添加过渡离开并持续时的样式
   * @param dom 元素
   */
  const addTransitionOutStyle = (dom: HTMLElement) => {
    Object.keys(transitionOutStyle).forEach(key => {
      dom.style[key] = transitionOutStyle[key]
    })
  }

  /**
   * 移除过渡离开并持续时的样式
   * @param dom 元素
   */
  const removeTransitionOutStyle = (dom: HTMLElement) => {
    Object.keys(transitionOutStyle).forEach(key => {
      dom.style[key] = transitionOriginStyle[key]
    })
  }

  /**
   * 添加过渡目标样式
   * @param dom 元素
   */
  const addEnterToStyle = (dom: HTMLElement) => {
    Object.keys(enterToStyle).forEach(key => {
      dom.style[key] = enterToStyle[key]
    })
  }

  /**
   * 移除过渡目标样式
   * @param dom 元素
   */
  const removeEnterToStyle = (dom: HTMLElement) => {
    Object.keys(enterToStyle).forEach(key => {
      dom.style[key] = transitionOriginStyle[key]
    })
  }

  /** 开始进入动画 */
  const startTransitionIn = () => {
    const dom = getDom()
    if (!dom) return

    addTransitionInStyle(dom)
    // 在下一帧插入动画运动目标状态
    requestAnimationFrame(() => {
      addEnterToStyle(dom)
    })
  }

  /** 开始离开动画 */
  const startTransitionOut = () => {
    const dom = getDom()
    if (!dom) return

    // 标记动画进入离开状态
    addTransitionOutStyle(dom)

    // 在下一帧移除动画运动目标状态恢复原状或者应用新的状态
    requestAnimationFrame(() => {
      removeEnterToStyle(dom)
    })
  }

  const transitionEndHandler = (e: TransitionEvent) => {
    e.stopPropagation()

    const dom = getDom()
    if (!dom) return
    // 激活状态，移除enter-active类
    if (_active) {
      removeTransitionInStyle(dom)
      afterEnter?.()
    } else {
      removeTransitionOutStyle(dom)
      afterLeave?.()
    }
  }

  const transitionCancelHandler = (e: TransitionEvent) => {
    e.stopPropagation()

    const dom = getDom()
    if (!dom) return
    // 激活状态，移除enter-active类
    if (_active) {
      removeTransitionInStyle(dom)
      enterCanceled?.()
    } else {
      removeTransitionOutStyle(dom)
      leaveCanceled?.()
    }
  }

  let _active = false
  const toggle = (active: boolean | ((active: boolean) => boolean)): void => {
    if (typeof active === 'function') {
      _active = active(_active)
      return toggle(_active)
    }
    _active = active
    _active ? startTransitionIn() : startTransitionOut()
  }

  /** 添加事件 */
  const addEvent = (el?: HTMLElement) => {
    el?.addEventListener('transitioncancel', transitionCancelHandler)
    el?.addEventListener('transitionend', transitionEndHandler)
  }

  /** 移除事件 */
  const removeEvent = (el?: HTMLElement) => {
    el?.removeEventListener('transitioncancel', transitionCancelHandler)
    el?.removeEventListener('transitionend', transitionEndHandler)
  }

  if (isRef(target)) {
    watch(target, (target, oldTarget) => {
      target ? addEvent(target) : removeEvent(oldTarget)
    })
  } else if (target) {
    addEvent(target)
  }

  onBeforeUnmount(() => {
    const dom = getDom()
    removeEvent(dom)
  })

  return {
    toggle
  }
}
