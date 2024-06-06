import { createIncrease } from '@ui/utils'
import { shallowReactive, watch, type ObjectDirective } from 'vue'

const uid = createIncrease(1000)
const targets = shallowReactive(
  new Map<string, { handler: (e: MouseEvent) => void; el: HTMLElement }>()
)

const documentClickHandler = (event: MouseEvent) => {
  targets.forEach(({ el, handler }) => {
    if (el.contains(event.target as Node)) return
    handler(event)
  })
}

let eventAdded = false

function addEvent() {
  if (eventAdded) return
  document.addEventListener('click', documentClickHandler, true)
  eventAdded = true
}

function removeEvent() {
  if (!eventAdded) return
  document.removeEventListener('click', documentClickHandler, true)
  eventAdded = false
}

watch(targets, async targets => {
  if (targets.size > 0) {
    return addEvent()
  }
  removeEvent()
})

export const vClickOutside: ObjectDirective<HTMLElement> = {
  mounted(el, binding) {
    if (!binding.value) return
    const id = String(uid())
    el.dataset.outsideId = id
    // 等待点击事件冒泡完毕
    targets.set(id, {
      handler: binding.value,
      el
    })
  },

  updated(el, binding) {
    if (!binding.value) {
      if (!el.dataset.outsideId) return
      targets.delete(el.dataset.outsideId)
    } else {
      if (!el.dataset.outsideId) {
        el.dataset.outsideId = String(uid())
      }

      targets.set(el.dataset.outsideId!, {
        handler: binding.value,
        el
      })
    }
  },

  unmounted(el: HTMLElement) {
    targets.delete(el.dataset.outsideId!)
  }
}
