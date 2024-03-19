// ClickOutsideDirective.ts
import type { DirectiveBinding } from "vue";

const ClickOutside = {
  beforeMount(el: HTMLElement, binding: DirectiveBinding) {
    const handleClick = (event: MouseEvent) => {
      if (!el.contains(event.target as Node)) {
        // 如果点击事件不发生在元素及其内部，则执行绑定的方法
        binding.value();
      }
    };

    // 监听全局点击事件
    document.addEventListener("click", handleClick);

    // 将处理函数保存在元素上，以便在 unmounted 时移除监听器
    el._clickOutsideHandler = handleClick;
  },

  unmounted(el: HTMLElement) {
    // 移除全局点击事件的监听器
    document.removeEventListener("click", el._clickOutsideHandler);
  },
};

export default ClickOutside;