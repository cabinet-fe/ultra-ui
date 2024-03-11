import type {DirectiveBinding} from "vue"

const ClickOutside = {
  async beforeMount(el: HTMLElement, binding: DirectiveBinding) {
    el.clickOutsideEvent = (event: MouseEvent) => {
      let targetNode = event.target as HTMLElement

      if (
        !el.contains(targetNode) &&
        targetNode !== el &&
        !el.parentElement?.contains(targetNode)
      ) {
        // 如果点击事件不是发生在元素及其父级内部，则执行绑定的方法
        binding.value()
      }
    }
    document.addEventListener("click", el.clickOutsideEvent)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener("click", el.clickOutsideEvent)
    delete el.clickOutsideEvent
  },
}

export default ClickOutside
