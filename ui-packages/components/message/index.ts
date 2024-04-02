export { default as UMessage } from './message.vue'
import UMessage from './message.vue'
import { createVNode, render, type VNode, watch } from 'vue'

export type {
  MessageProps,
  MessageEmits,
  MessageExposed
} from '@ui/types/components/message'

type MessageItem = {
  vm: VNode
}

const messageQueue: MessageItem[] = []

let offset = -32

export const Message = (options={}) => {
  const container = document.createElement('div')
  offset += 52
  const vm = createVNode(UMessage, { ...options, style: { top: `${offset}px` }})
  render(vm, container)
  messageQueue.push({ vm })
  document.body.appendChild(container.firstElementChild!)
}
