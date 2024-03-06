import type { DirectiveBinding } from 'vue'

function contextmenuHandler() {
  console.log(1111)
}

/** 注册右击事件
 * @param el
 */
const contextmenuEvent = (
  el: HTMLElement,
  binding: DirectiveBinding<any>,
  vnode,
  prevVnode
) => {
  // 指令绑定false不执行
  if (binding.value === false) return

  el.addEventListener('contextmenu', contextmenuHandler)
}

/**
 * 注销右击事件
 * @param el
 */
const unregisterEvents = (el: HTMLElement) => {
  el.removeEventListener('contextmenu', contextmenuHandler)
}

const ContextmenuOperation = {
  mounted: contextmenuEvent,

  beforeUnmount: unregisterEvents
}

export default ContextmenuOperation
