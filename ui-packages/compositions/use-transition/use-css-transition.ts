import { isRef, watch, onBeforeUnmount, computed } from 'vue'
import type { Returned, CssTransitionOptions } from './type'
import { createToggle, nextFrame } from '@ui/utils'

/**
 * 使用css过渡
 * @param options 过渡选项
 */
export function useCssTransition(options: CssTransitionOptions): Returned {
  const { name, target, afterEnter, afterLeave, enterCanceled, leaveCanceled } =
    options

  const getDom = (): HTMLElement | undefined =>
    isRef(target) ? target.value : target

  const classes = computed(() => {
    const _name = typeof name === 'string' ? name : name.value
    return {
      /** 进入后最终的类 */
      enterTo: `${_name}-enter-to`,
      /** 【进入动画】持续时的类 */
      enterActive: `${_name}-enter-active`,
      /** 【离开动画】持续时的类 */
      leaveActive: `${_name}-leave-active`
    }
  })

  /** 开始进入动画 */
  const startTransitionIn = () => {
    const { enterActive, enterTo } = classes.value
    const dom = getDom()

    dom?.classList.add(enterActive)
    // 在下一帧插入动画运动目标状态
    nextFrame(() => {
      dom?.classList.add(enterTo)
    })
  }

  /** 开始离开动画 */
  const startTransitionOut = () => {
    const { enterTo, leaveActive } = classes.value
    const dom = getDom()

    // 标记动画进入离开状态
    dom?.classList.add(leaveActive)

    // 在下一帧移除动画运动目标状态恢复原点
    nextFrame(() => {
      dom?.classList.remove(enterTo)
    })
  }

  const transitionEndHandler = (e: TransitionEvent) => {
    e.stopPropagation()

    const { leaveActive, enterActive } = classes.value
    const dom = getDom()
    // 激活状态，移除enter-active类
    if (active.value) {
      dom?.classList.remove(enterActive)
      afterEnter?.()
    } else {
      dom?.classList.remove(leaveActive)
      afterLeave?.()
    }
  }

  const transitionCancelHandler = (e: TransitionEvent) => {
    e.stopPropagation()

    const { leaveActive, enterActive } = classes.value
    const dom = getDom()
    // 激活状态，移除enter-active类
    if (active.value) {
      dom?.classList.remove(enterActive)
      enterCanceled?.()
    } else {
      dom?.classList.remove(leaveActive)
      leaveCanceled?.()
    }
  }

  const [active, toggle] = createToggle(false, active => {
    active ? startTransitionIn() : startTransitionOut()
  })

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
    toggle,
    enter() {
      toggle(true)
    },
    leave() {
      toggle(false)
    }
  }
}
