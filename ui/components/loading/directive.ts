import {
  createVNode,
  render,
  type DirectiveBinding,
  type ObjectDirective
} from 'vue'
import LoadingComponent from './loading.vue'
import { bem } from '@ui/utils'
import type { LoadingType } from '@ui/types/components/loading'

const loadingCls = bem('loading')
const loadingContainerCls = loadingCls.e('container')

function renderLoading(el: HTMLElement, binding: DirectiveBinding) {
  el.classList.add(loadingContainerCls)

  const node = createVNode(LoadingComponent, {
    type: binding.arg as LoadingType
  })

  render(node, el)
}

function removeLoading(el: HTMLElement) {
  render(null, el)
  el.classList.remove(loadingContainerCls)
}
export const vLoading: ObjectDirective<HTMLElement> = {
  mounted(el, binding) {
    binding.value && renderLoading(el, binding)
  },

  updated(el, binding) {
    binding.value ? renderLoading(el, binding) : removeLoading(el)
  },

  unmounted(el) {
    removeLoading(el)
  }
}
