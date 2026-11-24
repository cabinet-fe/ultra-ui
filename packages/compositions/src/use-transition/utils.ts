import { watch, onBeforeUnmount } from 'vue'

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
