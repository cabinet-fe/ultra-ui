import {h, render, type Directive, type DirectiveBinding} from "vue"
import LoadingComponent from "./loading.vue"
import {createIncrease} from "@ui/utils"

let timers = new Map<number, number>()

const uid = createIncrease(1000)

const loading: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    timers.forEach(clearTimeout)

    el.style.position = "relative"
    // 读取自定义属性
    const node = h(LoadingComponent, {
      text: el.getAttribute("loading-text") || "Loading...",
      background: el.getAttribute("loading-background") || "",
      loadingIcon: binding.arg,
    })

    render(node, el)
  },

  updated(el, binding) {
    let loadingHtml = el.querySelector(".u-loading")
    let id = uid()

    if (!binding.value) {
      clearTimeout(timers.get(id))
      timers.set(
        id,
        setTimeout(() => {
          loadingHtml.style.display = "none"
        }, 1500)
      )
    } else {
      loadingHtml.style.display = "inline-flex"
    }
  },

  unmounted(el) {
    timers.forEach(clearTimeout)
    // 指令解绑时，卸载 loading 组件
    el.removeChild(el.querySelector(".u-loading"))
  },
}

export default loading
