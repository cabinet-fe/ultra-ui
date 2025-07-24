import type { DirectiveBinding, ObjectDirective } from 'vue'
import { Ripple } from './ripple'

const rippleMap = new WeakMap<HTMLElement, Ripple>()

function handleMousedown(e: MouseEvent) {
  const container = e.currentTarget as HTMLElement
  rippleMap.get(container)?.showByEvent(e)
}

function handleMouseup(e: MouseEvent) {
  rippleMap.get(e.currentTarget as HTMLElement)?.remove()
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
  // 如果指令绑定的值为false则不应用该事件. eg: v-ripple="false"
  if (binding.value === false) return

  rippleMap.set(
    el,
    new Ripple(el, {
      rippleClass: binding.value,
      duration: binding.arg ? Number(binding.arg) : undefined
    })
  )

  el.addEventListener('mousedown', handleMousedown)
  el.addEventListener('mouseup', handleMouseup)
  el.addEventListener('mouseleave', handleMouseleave)
}

/**
 * 注销按下事件
 * @param el 元素
 */
const unregisterEvents = (el: HTMLElement) => {
  rippleMap.get(el)?.remove()
  rippleMap.delete(el)
  el.removeEventListener('mousedown', handleMousedown)
  el.removeEventListener('mouseup', handleMouseup)
  el.removeEventListener('mouseleave', handleMouseleave)
}

export { Ripple }

export const vRipple: ObjectDirective<HTMLElement> = {
  mounted: registerEvents,

  unmounted: unregisterEvents,

  beforeUpdate(el, binding) {
    // console.log(el.classList.contains(Ripple.cls.b))
  },

  updated(el, binding, vnode, prevVNode) {
    console.log(vnode.props, prevVNode.props)
    const registered = binding.oldValue !== false

    if (
      !el.classList.contains(Ripple.cls.b)
      // rippleMap.get(el)?.rippleElAmount
    ) {
      el.classList.add(Ripple.cls.b)
    }

    if (binding.value !== false) {
      if (!registered) {
        registerEvents(el, binding)
      } else {
        // class被重置时重新添加
      }
    } else {
      if (registered) {
        unregisterEvents(el)
      }
    }
  }
}
