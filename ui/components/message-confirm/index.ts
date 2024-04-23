export { default as UMessageConfirm } from './message-confirm.vue'

export type {
  MessageConfirmProps,
  MessageConfirmEmits,
  MessageConfirmExposed
} from '@ui/types/components/message-confirm'

import type { MessageConfirmProps } from '@ui/types/components/message-confirm'
import UMessageConfirm from './message-confirm.vue'
import { createVNode, render } from 'vue'
import { zIndex } from '@ui/utils'

export const MessageConfirm = (options: MessageConfirmProps) => {
  const container = document.createElement('div')
  const vm = createVNode(UMessageConfirm, {
    ...options, zIndex: zIndex()
  })
  vm.props!.onDestroy = () => render(null, container)
  render(vm, container)
  document.body.appendChild(container.firstElementChild!)
}