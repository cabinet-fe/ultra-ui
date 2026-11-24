import { createToggle, nextFrame, setStyles } from '@veltra/utils'
import { isRef, watch, type CSSProperties } from 'vue'

import type { Returned, StyleTransitionOptions } from './type'
import { watchTransition } from './utils'

export function useStyleTransition(options: StyleTransitionOptions): Returned {
  const {
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

  const transitionOriginStyle: CSSProperties = {}

  const getOriginStyles = (styles: CSSProperties) => {
    return Object.fromEntries(
      Object.keys(styles).map((key) => {
        return [key, transitionOriginStyle[key as keyof CSSProperties]]
      })
    )
  }

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

  const addEnterActive = (dom: HTMLElement) => {
    setStyles(dom, enterActive)
  }

  const removeEnterActive = (dom: HTMLElement) => {
    setStyles(dom, getOriginStyles(enterActive))
  }

  const addLeaveActive = (dom: HTMLElement) => {
    setStyles(dom, leaveActive)
  }

  const removeLeaveActive = (dom: HTMLElement) => {
    setStyles(dom, getOriginStyles(leaveActive))
  }

  const addEnterToStyle = (dom: HTMLElement) => {
    setStyles(dom, enterTo)
  }

  const removeEnterToStyle = (dom: HTMLElement) => {
    setStyles(dom, getOriginStyles(enterTo))
  }

  const startEnter = () => {
    const dom = getDom()
    if (!dom) return
    addEnterActive(dom)
    nextFrame(() => {
      addEnterToStyle(dom)
    })
  }

  const startLeave = () => {
    const dom = getDom()
    if (!dom) return

    addLeaveActive(dom)

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
        afterEnter?.()
      } else {
        removeLeaveActive(el)

        afterLeave?.()
      }
    }
  })

  return { toggle, enter: () => toggle(true), leave: () => toggle(false) }
}
