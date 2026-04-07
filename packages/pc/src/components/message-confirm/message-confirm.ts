import type { MessageConfirmProps, ColorType } from '@ultra-ui/pc/types'
import UMessageConfirm from './message-confirm.vue'
import { createVNode, render } from 'vue'
import { zIndex } from '@ultra-ui/core'

const ColorTypeArray: ColorType[] = [
  'primary',
  'success',
  'info',
  'warning',
  'danger'
]

type MessageConfirmFn = (options: MessageConfirmProps) => void

type MessageConfirmTypeFn = {
  [k in ColorType]: (
    message: string,
    onClose?: (action: 'cancel' | 'confirm') => void
  ) => void
} & MessageConfirmFn

function MessageConfirm(options: MessageConfirmProps) {
  const container = document.createElement('div')
  const vm = createVNode(UMessageConfirm, {
    ...options,
    zIndex: zIndex()
  })
  vm.props!.onDestroy = () => render(null, container)
  render(vm, container)
  document.body.appendChild(container.firstElementChild!)
}

const api = MessageConfirm as MessageConfirmTypeFn

ColorTypeArray.forEach(type => {
  api[type] = (
    message: string,
    onClose?: (action: 'cancel' | 'confirm') => void
  ) => {
    return MessageConfirm({
      message,
      confirmButtonType: type,
      onClose
    })
  }
})

export default api
