export { default as UMessage } from './message.vue'
import UMessage from './message.vue'
import { createVNode, render, type VNode, ref } from 'vue'

export type {
  MessageProps,
  MessageEmits,
  MessageExposed
} from '@ui/types/components/message'

type MessageItem = {
  vm: VNode
}

const messageQueue = ref<MessageItem[]>([])

let offset = 20

let count = 1

const close = (id: string, userClose?: (vm: VNode) => void) => {
  const index = messageQueue.value.findIndex(({ vm }) => {
    return id === vm.component!.props.id
  })
  if (index > -1) {
    messageQueue.value.splice(index, 1)
    offset = messageQueue.value.length * 52 + 20
    let offsetHeight = 20
    messageQueue.value.forEach((message) => {
      message.vm.component!.props.offset = offsetHeight
      offsetHeight += 52
    })
  }
}

export const Message = (options: Record<string, any>) => {
  const container = document.createElement('div')
  const id = `message_${count++}`
  const vm = createVNode(UMessage, {
    ...options, offset, id, onClose: () => {
      close(id, options.onClose)
    }
  })
  vm.props!.onDestroy = () => render(null, container)
  render(vm, container)
  messageQueue.value.push({ vm })
  document.body.appendChild(container.firstElementChild!)
  offset = messageQueue.value.length * 52 + 20
}
