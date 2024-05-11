import UMessage from './message.vue'
import { createVNode, render, type VNode, ref } from 'vue'

import type { MessageProps } from '@ui/types/components/message'
import type { ColorType } from '@ui/types/component-common'

type MessageItem = {
  vm: VNode
}

const messageQueue = ref<MessageItem[]>([])

let count = 1

const close = (id: string, userClose?: (vm: VNode) => void) => {
  const index = messageQueue.value.findIndex(({ vm }) => {
    return id === vm.component!.props.id
  })
  if (index > -1) {
    const { vm } = messageQueue.value[index]!
    userClose?.(vm)
    const removedHeight = vm.el!.offsetHeight
    messageQueue.value.splice(index, 1)
    messageQueue.value.forEach((message, i) => {
      if (i >= index) {
        message.vm.component!.props.offset = parseInt(message.vm.el!.style['top'], 10) - removedHeight - 16
      }
    })
  }
}

type MessageFn = (options: MessageProps) => void
interface MessageTypeFn extends MessageFn {
  success: (message: string) => void
  primary: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
  danger: (message: string) => void
}

const Message: MessageFn & Partial<MessageTypeFn> = (options: MessageProps) => {
  const container = document.createElement('div')
  const id = `message_${count++}`
  let offset = options.offset || 20
  messageQueue.value.forEach(({ vm }) => {
    offset += (vm.el?.offsetHeight || 0) + 16
  })
  offset += 16
  const vm = createVNode(UMessage, {
    ...options, offset, id, onClose: () => {
      close(id, options.onClose)
    }
  })
  vm.props!.onDestroy = () => render(null, container)
  render(vm, container)
  messageQueue.value.push({ vm })
  document.body.appendChild(container.firstElementChild!)
}

const messageTypes: Array<ColorType> = ['success', 'primary', 'info', 'warning', 'danger']

messageTypes.forEach((type) => {
  Message[type] = (message: string) => {
    return Message({
      message,
      type,
    })
  }
})

export default Message as MessageTypeFn