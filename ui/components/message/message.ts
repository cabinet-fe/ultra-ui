import UMessage from './message.vue'
import { createVNode, render, type VNode, Fragment } from 'vue'
import type { MessageProps, MessageType } from '@ui/types/components/message'
import { bem, setStyles, zIndex } from '@ui/utils'

export const messageTypes: Array<MessageType> = [
  'success',
  'warn',
  'info',
  'error',
  'default'
]

let uid = 0

type Message = {
  (options: MessageProps | MessageType): void
  /** 关闭所有的消息 */
  closeAll(): void
} & {
  [key in MessageType]: (
    /** 消息 */
    message: string,
    /** 消息配置 */
    config?: Omit<MessageProps, 'type' | 'message'>
  ) => void
}

const messageInstances = new Set<VNode>()

let container: HTMLElement | null = null

function renderMessage() {
  if (!messageInstances.size) {
    render(null, container!)

    container!.remove()
    container = null
    return
  }
  setStyles(container!, { zIndex: zIndex() })
  const fragment = createVNode(Fragment, null, Array.from(messageInstances))
  render(fragment, container!)
}

const cls = bem('message')

export const message: Message = options => {
  if (typeof options === 'string') {
    options = {
      message: options
    }
  }

  const { onClose, ...restOptions } = options

  if (!container) {
    container = document.createElement('div')
    container.className = cls.e('container')

    document.body.appendChild(container)
  }

  const node = createVNode(UMessage, {
    ...restOptions,
    onClose: () => {
      onClose?.()
    },
    key: uid++
  })

  node.props!.onDestroy = () => {
    messageInstances.delete(node)
    renderMessage()
  }

  messageInstances.add(node)
  renderMessage()
}

message.closeAll = () => {
  messageInstances.forEach(node => {
    node.component!.exposed!.immediateClose()
  })
}

message.success = (msg, config) => {
  message({
    message: msg,
    type: 'success',
    ...config
  })
}
message.warn = (msg, config) => {
  message({
    message: msg,
    type: 'warn',
    ...config
  })
}
message.error = (msg, config) => {
  message({
    message: msg,
    type: 'error',
    ...config
  })
}
message.info = (msg, config) => {
  message({
    message: msg,
    type: 'info',
    ...config
  })
}
message.default = (msg, config) => {
  message({
    message: msg,
    type: 'default',
    ...config
  })
}
