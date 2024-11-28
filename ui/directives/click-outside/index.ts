import { createIncrease } from '@ui/utils'
import { shallowReactive, watch, type ObjectDirective } from 'vue'

const uid = createIncrease(1000)
const targets = shallowReactive(
  new Map<string, { handler: (e: MouseEvent) => void; el: HTMLElement }>()
)

let eventAdded = false
let mousedownEvent: MouseEvent | undefined

const documentClickHandler = (event: MouseEvent) => {
  if (!mousedownEvent) return

  if (mousedownEvent.target !== event.target) {
    return (mousedownEvent = undefined)
  }
  targets.forEach(({ el, handler }) => {
    if (el.contains(event.target as Node)) return
    handler(event)
  })
  mousedownEvent = undefined
}

function addEvent() {
  if (eventAdded) return
  document.addEventListener('mousedown', e => {
    mousedownEvent = e
  })
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

    // 为元素添加一个id， 并加入到字典中
    const id = String(uid())
    el.dataset.outsideId = id

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
