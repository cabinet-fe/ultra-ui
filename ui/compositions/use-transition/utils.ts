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
) {
  const runCallback = (e: TransitionEvent, cb: (el: HTMLElement) => void) => {
    e.stopPropagation()
    if (
      e.target !== domGetter() ||
      !config.styleKeys.includes(e.propertyName)
    ) {
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
