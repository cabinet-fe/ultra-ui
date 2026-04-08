import './style'
import type { DirectiveBinding, ObjectDirective } from 'vue'
import { Ripple } from './ripple'

const rippleMap = new WeakMap<HTMLElement, Ripple>()

function handleMousedown(e: MouseEvent) {
  if (e.button !== 0) return
  const container = e.currentTarget as HTMLElement

  const mouseupHandler = () => {
    rippleMap.get(container)?.remove()
    document.removeEventListener('mouseup', mouseupHandler)
  }

  document.addEventListener('mouseup', mouseupHandler)

  let ripple = rippleMap.get(container)
  if (!ripple) {
    const { rippleClass, duration } = container.dataset
    ripple = new Ripple(container, {
      rippleClass,
      duration: duration ? Number(duration) : undefined
    })
    rippleMap.set(container, ripple)
  }

  ripple.showByEvent(e)
}

function handleMouseleave(e: MouseEvent) {
  rippleMap.get(e.currentTarget as HTMLElement)?.remove()
}

/**
 * 注册按下事件
 * @param el
 * @param binding
 * @todo 如有必要将来可添加触摸事件
 */
const registerEvents = (el: HTMLElement, binding: DirectiveBinding<any>) => {
  // 如果指令绑定的值为false则不应用该事件.
  if (binding.value === false) return

  el.addEventListener('mousedown', handleMousedown)
  el.addEventListener('mouseleave', handleMouseleave)
}

/**
 * 注销按下事件
 * @param el 元素
 */
const unregisterEvents = (el: HTMLElement) => {
  el.removeEventListener('mousedown', handleMousedown)
  el.removeEventListener('mouseleave', handleMouseleave)
}

export { Ripple }

export const vRipple: ObjectDirective<HTMLElement> = {
  mounted: (el, binding) => {
    if (binding.value !== false) {
      el.dataset.rippleClass = binding.value
    }

    if (binding.arg) {
      el.dataset.duration = binding.arg
    }

    registerEvents(el, binding)
  },

  unmounted: el => {
    unregisterEvents(el)
    rippleMap.get(el)?.remove()
    rippleMap.delete(el)
  },

  updated(el, binding) {
    const registered = binding.oldValue !== false

    if (binding.value !== false) {
      if (!registered) {
        registerEvents(el, binding)
      }
    } else {
      if (registered) {
        unregisterEvents(el)
      }
    }
  }
}
