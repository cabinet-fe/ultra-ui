import { createIncrease } from '@ui/utils'
import { shallowReactive, watch, type ObjectDirective } from 'vue'

const uid = createIncrease(1000)
const targets = shallowReactive(
  new Map<string, { handler: () => void; el: HTMLElement }>()
)

const documentClickHandler = (event: MouseEvent) => {
  targets.forEach(({ el, handler }) => {
    if (el.contains(event.target as Node)) return
    handler()
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
  document.removeEventListener('click', documentClickHandler)
  eventAdded = false
}

watch(targets, async targets => {
  if (targets.size > 0) {
    return addEvent()
  }
  removeEvent()
})

const ClickOutside: ObjectDirective<HTMLElement> = {
  mounted(el, binding) {
    const id = String(uid())
    el.dataset.outsideId = id
    // 等待点击事件冒泡完毕
    targets.set(id, {
      handler: binding.value,
      el
    })
  },

  unmounted(el: HTMLElement) {
    targets.delete(el.dataset.outsideId!)
  }
}

export default ClickOutside
