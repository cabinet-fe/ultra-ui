import type {DirectiveBinding} from "vue"

const ClickOutside = {
  beforeMount(el: HTMLElement, binding: DirectiveBinding) {
    // 在元素上添加鼠标按下事件监听器
    const handleClick = (event: MouseEvent) => {
      // 获取点击目标元素
      const target = event.target as Node;
      
      // 判断点击目标是否为当前绑定的元素或其子元素
      if (el.contains(target) || el === target) {
        return;
      }
      
      // 执行传入的处理函数
      binding.value();
    }

    // 监听全局点击事件
    document.addEventListener("click", handleClick);

    // 将处理函数保存在元素上，以便在 unmounted 时移除监听器
    el._clickOutsideHandler = handleClick;
  },

  unmounted(el: HTMLElement) {
    // 移除全局点击事件的监听器
    document.removeEventListener("click", el._clickOutsideHandler);
  },
}

export default ClickOutside

