import { isRef, watch, type CSSProperties } from 'vue'
import type { Returned, StyleTransitionOptions } from './type'
import { createToggle, nextFrame, setStyles } from '@ui/utils'
import { watchTransition } from './utils'

export function useStyleTransition(options: StyleTransitionOptions): Returned {
  const {
    // enterFrom,
    // leaveTo,
    enterTo,
    enterActive,
    leaveActive,
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

  /** 获取过渡样式的初始样式 */
  const getOriginStyles = (styles: CSSProperties) => {
    return Object.fromEntries(
      Object.keys(styles).map(key => {
        return [key, transitionOriginStyle[key]]
      })
    )
  }
  // 监听dom并获取dom在进入动画之前的样式
  // ...Object.keys(enterFrom ?? {}),
  // ...Object.keys(leaveTo ?? {}),
  watch(
    () => getDom(),
    dom => {
      if (dom) {
        const map = dom.attributeStyleMap
        ~[...Object.keys(enterTo), ...Object.keys(enterActive)].forEach(key => {
          transitionOriginStyle[key] = map.get(key)
        })
      } else {
        Object.keys(transitionOriginStyle).forEach(key => {
          delete transitionOriginStyle[key]
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
  const addEnterActive = (dom: HTMLElement) => {
    setStyles(dom, enterActive)
  }

  /**
   * 移除过渡进入时并持续时的样式
   * @param dom 元素
   */
  const removeEnterActive = (dom: HTMLElement) => {
    setStyles(dom, getOriginStyles(enterActive))
  }

  /**
   * 添加过渡离开并持续时的样式
   * @param dom 元素
   */
  const addLeaveActive = (dom: HTMLElement) => {
    setStyles(dom, leaveActive)
  }

  /**
   * 移除过渡离开并持续时的样式
   * @param dom 元素
   */
  const removeLeaveActive = (dom: HTMLElement) => {
    setStyles(dom, getOriginStyles(leaveActive))
  }

  /**
   * 添加过渡目标样式
   * @param dom 元素
   */
  // const addEnterFromStyle = (dom: HTMLElement) => {
  //   enterFrom && setStyles(dom, enterFrom)
  // }

  /**
   * 移除过渡目标样式
   * @param dom 元素
   */
  // const removeEnterFromStyle = (dom: HTMLElement) => {
  //   if (!enterFrom) return

  //   const canRemovedStyles = {}

  //   for (const key in enterFrom) {
  //     if (key in enterTo) continue
  //     canRemovedStyles[key] = enterFrom[key]
  //   }

  //   setStyles(dom, getOriginStyles(canRemovedStyles))
  // }
  /**
   * 添加过渡目标样式
   * @param dom 元素
   */
  const addEnterToStyle = (dom: HTMLElement) => {
    setStyles(dom, enterTo)
  }

  /**
   * 移除过渡目标样式
   * @param dom 元素
   */
  const removeEnterToStyle = (dom: HTMLElement) => {
    setStyles(dom, getOriginStyles(enterTo))
  }

  /** 开始进入动画 */
  const startEnter = () => {
    const dom = getDom()
    if (!dom) return
    addEnterActive(dom)
    // 在下一帧插入动画运动目标状态
    nextFrame(() => {
      addEnterToStyle(dom)
    })
  }

  /** 开始离开动画 */
  const startLeave = () => {
    const dom = getDom()
    if (!dom) return

    // 标记动画进入离开状态
    addLeaveActive(dom)

    // 在下一帧移除动画运动目标状态恢复原状或者应用新的状态
    nextFrame(() => {
      removeEnterToStyle(dom)
    })
  }

  const [active, toggle] = createToggle(false, active => {
    active ? startEnter() : startLeave()
  })

  watchTransition(getDom, {
    styleKeys: Object.keys(enterTo),
    onCancel(el) {
      // 激活状态，移除enter-active类
      if (active.value) {
        removeEnterActive(el)
        enterCanceled?.()
      } else {
        removeLeaveActive(el)
        leaveCanceled?.()
      }
    },

    onEnd(el) {
      if (active.value) {
        removeEnterActive(el)
        // removeEnterFromStyle(el)
        afterEnter?.()
      } else {
        removeLeaveActive(el)

        afterLeave?.()
      }
    }
  })

  return {
    toggle,
    enter: () => toggle(true),
    leave: () => toggle(false)
  }
}
