import { createIncrease } from '@ultra-ui/utils'
import type { ObjectDirective } from 'vue'

const uid = createIncrease(1000)
const targets = new Map<
  string,
  { handler: (e: MouseEvent) => void; el: HTMLElement }
>()

let eventAdded = false
let mousedownEvent: MouseEvent | undefined

const documentClickHandler = (event: MouseEvent) => {
  if (!mousedownEvent) return
  if (mousedownEvent?.target !== event.target) {
    return (mousedownEvent = undefined)
  }
  targets.forEach(({ el, handler }) => {
    if (el.contains(event.target as Node)) return
    handler(event)
  })
  mousedownEvent = undefined
}

function documentMousedownHandler(event: MouseEvent) {
  mousedownEvent = event
}

function addEvent() {
  if (eventAdded) return
  document.addEventListener('mousedown', documentMousedownHandler, true)
  document.addEventListener('click', documentClickHandler, true)
  eventAdded = true
}

function removeEvent() {
  if (!eventAdded) return
  document.removeEventListener('click', documentClickHandler, true)
  document.removeEventListener('mousedown', documentMousedownHandler, true)
  eventAdded = false
}

function syncDocumentEvents(): void {
  if (typeof document === 'undefined') return

  if (targets.size > 0) {
    addEvent()
  } else {
    removeEvent()
  }
}

export const vClickOutside: ObjectDirective<HTMLElement> = {
  mounted(el, binding) {
    if (!binding.value) return

    // 为元素添加一个id， 并加入到字典中
    const id = String(uid())
    el.dataset.outsideId = id

    targets.set(id, {
      handler: binding.value,
      el
    })
    syncDocumentEvents()
  },

  updated(el, binding) {
    if (!binding.value) {
      if (!el.dataset.outsideId) return
      targets.delete(el.dataset.outsideId)
      syncDocumentEvents()
    } else {
      if (!el.dataset.outsideId) {
        el.dataset.outsideId = String(uid())
      }

      targets.set(el.dataset.outsideId!, {
        handler: binding.value,
        el
      })
      syncDocumentEvents()
    }
  },

  unmounted(el: HTMLElement) {
    targets.delete(el.dataset.outsideId!)
    syncDocumentEvents()
  }
}
