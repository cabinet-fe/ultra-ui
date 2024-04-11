import {
  createApp,
  h,
  render,
  type Directive,
  type DirectiveBinding
} from 'vue'
import LoadingComponent from './loading.vue'
import countPosition from '../tip/position'

const loading: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    el.style.position = 'relative'
    // const app = createApp(LoadingComponent)

    const node = h(LoadingComponent, {
      loadingIcon: binding.arg
    })

    render(node, el)

    // const loadingInstance = app.mount(document.createElement("div"))
    // el.appendChild(loadingInstance.$el)
    // el._loadingInstance = loadingInstance
  },

  updated(el, binding) {


    if (!binding.value) {
      el.removeChild(el.querySelector('.u-loading'))
    }
    // 读取自定义属性
    const text = el.getAttribute('loading-text') || 'Loading...'
    const background = el.getAttribute('loading-background')
    const icon = el.getAttribute('loading-icon')

    let props = {
      show: binding.value,
      text: text,
      background: background,
      icon: binding.arg?.[0]
    }

    if (el._loadingInstance) {
      // 指令绑定的值前后不一样时
      if (binding.oldValue !== binding.value) {
        el._loadingInstance.toggleVisible(props)
      }
    }
  },

  unmounted(el) {
    // 指令解绑时，卸载 loading 组件
    if (el._loadingInstance) {
      delete el._loadingInstance
    }
  }
}

export default loading
