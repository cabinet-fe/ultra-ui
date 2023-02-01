import type {
  ComponentPublicInstance,
  DirectiveBinding,
  ObjectDirective
} from 'vue'

const ClickOutside: ObjectDirective<HTMLElement> = {
  // 挂载前
  beforeMount(el, binding) {

  },
  // 更新后
  updated(el, binding) {},
  // 卸载
  unmounted(el) {}
}

export default ClickOutside
