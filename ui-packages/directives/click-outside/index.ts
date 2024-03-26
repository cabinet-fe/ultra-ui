import type {DirectiveBinding} from "vue"

const ClickOutside = {
  beforeMount(el: HTMLElement, binding: DirectiveBinding) {
    let cls = el.classList[0]
    // 在元素上添加鼠标按下事件监听器
    const handleClick = (event: MouseEvent) => {
      if (!el.contains(event.target as Node)) {
        binding.value(cls)
      }
    }

    // 监听全局点击事件
    
    document.addEventListener("click", handleClick)

    // 将处理函数保存在元素上，以便在 unmounted 时移除监听器
    el._clickOutsideHandler = handleClick
  },

  unmounted(el: HTMLElement) {
    // 移除全局点击事件的监听器
    document.removeEventListener("click", el._clickOutsideHandler)
  },
}

export default ClickOutside
