import type { MessageConfirmProps } from '@ui/types/components/message-confirm'
import UMessageConfirm from './message-confirm.vue'
import { createVNode, render } from 'vue'
import { zIndex } from '@ui/utils'
import { type ColorType, ColorTypeArray } from '@ui/types/component-common'

type MessageConfirmFn = (options: MessageConfirmProps) => void

type MessageConfirmTypeFn = {
  [k in ColorType]: (message: string, onClose?: (action: 'cancel' | 'confirm') => void) => void
} & MessageConfirmFn

const MessageConfirm: MessageConfirmFn & Partial<MessageConfirmTypeFn> = (options: MessageConfirmProps) => {
  const container = document.createElement('div')
  const vm = createVNode(UMessageConfirm, {
    ...options, zIndex: zIndex()
  })
  vm.props!.onDestroy = () => render(null, container)
  render(vm, container)
  document.body.appendChild(container.firstElementChild!)
}

ColorTypeArray.forEach((type) => {
  MessageConfirm[type] = (message: string, onClose?: (action: 'cancel' | 'confirm') => void) => {
    return MessageConfirm({
      message,
      confirmButtonType: type,
      onClose
    })
  }
})

export default MessageConfirm as MessageConfirmTypeFn