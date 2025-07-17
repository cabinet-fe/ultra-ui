import type { DirectiveBinding, ObjectDirective } from 'vue'
import { Ripple } from './ripple'

const rippleMap = new Map<HTMLElement, Ripple>()

function handleMousedown(e: MouseEvent) {
  const container = e.currentTarget as HTMLElement
  const ripple = rippleMap.get(container) || new Ripple(container)
  ripple.showByEvent(e)
  rippleMap.set(container, ripple)
}

function handleMouseup(e: MouseEvent) {
  rippleMap.get(e.currentTarget as HTMLElement)?.hide()
}

function handleMouseleave(e: MouseEvent) {
  rippleMap.get(e.currentTarget as HTMLElement)?.hide()
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
      duration: binding.arg
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
  delete el.dataset.rippleClass
  delete el.dataset.duration
  rippleMap.delete(el)
  el.removeEventListener('mousedown', handleMousedown)
  el.removeEventListener('mouseup', handleMouseup)
  el.removeEventListener('mouseleave', handleMouseleave)
}

export const vRipple: ObjectDirective<HTMLElement> = {
  // 元素的dom挂载后注册按下事件
  mounted: registerEvents,

  // 元素卸载前注销事件
  unmounted: unregisterEvents,

  // 元素更新时移除旧有事件并重新添加事件
  updated(el, binding) {
    el.dataset.class && el.classList.add(el.dataset.class)

    const registered = !!binding.oldValue
    if (binding.value && !registered) {
      registerEvents(el, binding)
    } else if (!binding.value && registered) {
      unregisterEvents(el)
    }
  }
}
