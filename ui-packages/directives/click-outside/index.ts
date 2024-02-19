import './style.scss'
import type { ObjectDirective } from 'vue'

const ClickOutside: ObjectDirective<HTMLElement> = {
  // 挂载前
  beforeMount(el, binding, vNode, preVNode) {},
  // 卸载
  unmounted(el) {}
}

export default ClickOutside
