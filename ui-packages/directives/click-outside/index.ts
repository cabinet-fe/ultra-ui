import './style.scss'
import { ObjectDirective } from 'vue'

type DirectiveHandler = () => void

const nodeHandlers = new Map<HTMLElement, DirectiveHandler>()

function clickHandler(ev: MouseEvent) {
  const target = ev.target as HTMLElement
  if (nodeHandlers.get(target)) return
  nodeHandlers.forEach(v => v())
}

// 是否已注册document事件
let registered = false

function register(el: HTMLElement, handler: DirectiveHandler) {
  nodeHandlers.set(el, handler)
  // 防止多次添加
  if (registered) return
  document.addEventListener('click', clickHandler)
  registered = true
}

function unregister(el: HTMLElement) {
  nodeHandlers.delete(el)
  if (!nodeHandlers.size) {
    document.removeEventListener('click', clickHandler)
    registered = false
  }
}

const ClickOutside: ObjectDirective<HTMLElement, DirectiveHandler> = {
  // 挂载前
  beforeMount(el, binding, vNode, preVNode) {
    register(el, binding.value)
  },
  // 卸载
  unmounted(el) {
    unregister(el)
  }
}

export default ClickOutside
