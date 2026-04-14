# use-transition

```typescript
import type { Returned, CssTransitionOptions, StyleTransitionOptions } from './type'
import { useCssTransition } from './use-css-transition'
import { useStyleTransition } from './use-style-transition'

/**
 * 使用CSS类过渡
 * @param type 过渡类型
 * @param options 过渡选项
 */
export function useTransition(type: 'css', options: CssTransitionOptions): Returned
/**
 * 使用style样式过渡
 * @param type 过渡类型
 * @param options 过渡选项
 */
export function useTransition(type: 'style', options: StyleTransitionOptions): Returned
export function useTransition(type: string, options: any): Returned {
  if (type === 'css') {
    return useCssTransition(options)
  }
  return useStyleTransition(options)
}
```

---

```typescript
import type { CSSProperties, Ref, ShallowRef } from 'vue'

export interface TransitionBase {
  /** 被应用的目标元素 */
  target: ShallowRef<HTMLElement | undefined> | HTMLElement
  /** 进入动画结束回调 */
  afterEnter?: () => void
  /** 进入动画被取消回调 */
  enterCanceled?: () => void
  /** 离开动画结束回调 */
  afterLeave?: () => void
  /** 离开动画被取消回调 */
  leaveCanceled?: () => void
}

export interface CssTransitionOptions extends TransitionBase {
  /** 类的名称, 会生成 `${name}-enter-${'to' | 'active' | 'from'}`, `${name}-leave-${'to' | 'active' | 'from'}这几种类` */
  name: ShallowRef<string> | string | Ref<string>
  /** 保留进入类 */
  keepEnterTo?: boolean
}

export interface StyleTransitionOptions extends TransitionBase {
  // /** 动画进入前的样式 */
  // enterFrom?: CSSProperties
  // /** 动画离开后的样式 */
  // leaveTo?: CSSProperties
  /** 进入后的样式 */
  enterTo: CSSProperties
  /** 进入过渡时的样式 */
  enterActive: CSSProperties
  /** 离开过渡时的样式 */
  leaveActive: CSSProperties
}

export interface Returned {
  /**
   * 切换进入/离开动画
   * @param active 是否激活
   */
  toggle(active: boolean | ((active: boolean) => boolean)): void
  /**
   * 标记进入动画, toggle(true)的别名
   */
  enter(): void
  /**
   * 标记离开动画, toggle(false)的别名
   */
  leave(): void
}
```

---

```typescript
import { createToggle } from '@veltra/utils'
import { isRef, watch, onBeforeUnmount, computed } from 'vue'

import type { Returned, CssTransitionOptions } from './type'

const increaseTransitionCount = (el: HTMLElement & { _count?: number }) => {
  el._count = (el._count ?? 0) + 1
}

const decreaseTransitionCount = (el: HTMLElement & { _count?: number }) => {
  el._count = (el._count ?? 0) - 1
  if (el._count <= 0) {
    delete el._count
  }
}

/**
 * 使用css过渡
 * @param options 过渡选项
 */
export function useCssTransition(options: CssTransitionOptions): Returned {
  const {
    name,
    target,
    afterEnter,
    afterLeave,
    enterCanceled,
    leaveCanceled,
    keepEnterTo = false
  } = options

  const getDom = (): (HTMLElement & { _count?: number }) | undefined =>
    isRef(target) ? target.value : target

  const classes = computed(() => {
    const _name = typeof name === 'string' ? name : name.value
    return {
      /** 进入前的类 */
      enterFrom: `${_name}-enter-from`,
      /** 进入后最终的类 */
      enterTo: `${_name}-enter-to`,
      /** 【进入动画】持续时的类 */
      enterActive: `${_name}-enter-active`,
      /** 离开前的类 */
      leaveFrom: `${_name}-leave-from`,
      /** 离开类 */
      leaveTo: `${_name}-leave-to`,
      /** 【离开动画】持续时的类 */
      leaveActive: `${_name}-leave-active`
    }
  })

  /** 开始进入动画 */
  const startTransitionIn = () => {
    const { enterActive, enterTo, enterFrom } = classes.value
    const dom = getDom()

    dom?.classList.add(enterFrom)

    requestAnimationFrame(() => {
      dom?.classList.add(enterActive)
      requestAnimationFrame(() => {
        dom?.classList.remove(enterFrom)
        dom?.classList.add(enterTo)
      })
    })
  }

  /** 开始离开动画 */
  const startTransitionOut = () => {
    const { leaveTo, leaveActive, leaveFrom, enterTo } = classes.value
    const dom = getDom()

    // 标记动画进入离开状态
    if (keepEnterTo) {
      dom?.classList.remove(enterTo)
    }
    dom?.classList.add(leaveFrom, leaveActive)

    requestAnimationFrame(() => {
      dom?.classList.add(leaveActive)
      requestAnimationFrame(() => {
        dom?.classList.remove(leaveFrom)
        dom?.classList.add(leaveTo)
      })
    })
  }

  const [active, toggle] = createToggle(false, (_active) => {
    _active ? startTransitionIn() : startTransitionOut()
  })

  const transitionEndHandler = (e: TransitionEvent) => {
    e.stopPropagation()

    const { leaveActive, enterActive, enterTo, leaveTo } = classes.value
    const dom = getDom()

    if (dom !== e.target) return

    decreaseTransitionCount(dom)

    if (dom._count) return

    // 激活状态，移除enter-active类
    if (active.value) {
      if (keepEnterTo) {
        dom?.classList.remove(enterActive)
      } else {
        dom?.classList.remove(enterActive, enterTo)
      }
      afterEnter?.()
    } else {
      dom?.classList.remove(leaveActive, leaveTo)
      afterLeave?.()
    }
  }

  const transitionRunHandler = (e: TransitionEvent) => {
    e.stopPropagation()
    const dom = getDom()
    if (dom !== e.target) return
    increaseTransitionCount(dom)
  }

  const transitionCancelHandler = (e: TransitionEvent) => {
    e.stopPropagation()
    const dom = getDom()

    if (dom !== e.target) return
    decreaseTransitionCount(dom)

    if (dom._count) return

    const { leaveActive, enterActive } = classes.value

    // 激活状态，移除enter-active类
    if (active.value) {
      dom?.classList.remove(enterActive)
      enterCanceled?.()
    } else {
      dom?.classList.remove(leaveActive)
      leaveCanceled?.()
    }
  }

  /** 添加事件 */
  const addEvent = (el?: HTMLElement) => {
    el?.addEventListener('transitioncancel', transitionCancelHandler)
    el?.addEventListener('transitionend', transitionEndHandler)
    el?.addEventListener('transitionrun', transitionRunHandler)
  }

  /** 移除事件 */
  const removeEvent = (el?: HTMLElement) => {
    el?.removeEventListener('transitioncancel', transitionCancelHandler)
    el?.removeEventListener('transitionend', transitionEndHandler)
    el?.removeEventListener('transitionrun', transitionRunHandler)
  }

  if (isRef(target)) {
    watch(target, (_target, oldTarget) => {
      if (oldTarget) {
        removeEvent(oldTarget)
      }
      _target && addEvent(_target)
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
```

---

```typescript
import { createToggle, nextFrame, setStyles } from '@veltra/utils'
import { isRef, watch, type CSSProperties } from 'vue'

import type { Returned, StyleTransitionOptions } from './type'
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

  const getDom = (): HTMLElement | undefined => (isRef(target) ? target.value : target)

  /** 进入动画前的初始状态 */
  const transitionOriginStyle: CSSProperties = {}

  /** 获取过渡样式的初始样式 */
  const getOriginStyles = (styles: CSSProperties) => {
    return Object.fromEntries(
      Object.keys(styles).map((key) => {
        return [key, transitionOriginStyle[key as keyof CSSProperties]]
      })
    )
  }
  // 监听dom并获取dom在进入动画之前的样式
  // ...Object.keys(enterFrom ?? {}),
  // ...Object.keys(leaveTo ?? {}),
  watch(
    () => getDom(),
    (dom) => {
      if (dom) {
        const map = dom.attributeStyleMap
        ~[...Object.keys(enterTo), ...Object.keys(enterActive)].forEach((key) => {
          transitionOriginStyle[key] = map.get(key)
        })
      } else {
        Object.keys(transitionOriginStyle).forEach((key) => {
          delete transitionOriginStyle[key as keyof CSSProperties]
        })
      }
    },
    { immediate: true }
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

  const [active, toggle] = createToggle(false, (active) => {
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

  return { toggle, enter: () => toggle(true), leave: () => toggle(false) }
}
```

---

```typescript
import { watch, onBeforeUnmount } from 'vue'

/**
 * 监听过渡
 * @param domGetter 元素获取函数
 * @param config 配置
 * @returns
 */
export function watchTransition(
  domGetter: () => HTMLElement | undefined,
  config: {
    styleKeys: string[]
    onEnd: (dom: HTMLElement) => void
    onCancel: (dom: HTMLElement) => void
  }
): void {
  const runCallback = (e: TransitionEvent, cb: (el: HTMLElement) => void) => {
    e.stopPropagation()
    if (e.target !== domGetter() || !config.styleKeys.includes(e.propertyName)) {
      return
    }

    cb(e.target as HTMLElement)
  }

  const transitionEndHandler = (e: TransitionEvent) => {
    if (!domGetter()) return
    runCallback(e, config.onEnd)
  }
  const transitionCancelHandler = (e: TransitionEvent) => {
    if (!domGetter()) return
    runCallback(e, config.onCancel)
  }
  const addEvent = (el: HTMLElement) => {
    el.addEventListener('transitionend', transitionEndHandler, false)
    // el.addEventListener('transitioncancel', transitionCancelHandler, false)
  }

  const removeEvent = (el?: HTMLElement) => {
    el?.removeEventListener('transitionend', transitionEndHandler)
    el?.removeEventListener('transitioncancel', transitionCancelHandler)
  }

  watch(
    domGetter,
    (target, oldTarget) => {
      removeEvent(oldTarget)
      target && addEvent(target)
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    removeEvent(domGetter())
  })
}
```
