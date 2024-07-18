import { createApp, h, shallowReactive, type App } from 'vue'
import type { MessageOptions, MessageType } from '@ui/types/components/message'
import { bem, setStyles, zIndex } from '@ui/utils'
import UMessageBox from './message-box.vue'

export const messageTypes: Array<MessageType> = [
  'success',
  'warn',
  'info',
  'error',
  'default'
]

let uid = 0

type MessageAliasFns = {
  [key in MessageType]: (
    /** 消息 */
    message: string,
    /** 消息配置 */
    config?: Omit<MessageOptions, 'type' | 'message'>
  ) => void
}

type Message = {
  (options: MessageOptions | MessageType): void
  /** 关闭所有的消息 */
  closeAll(): void
} & MessageAliasFns

const cls = bem('message')

let messageApp: App | null = null

const messages = shallowReactive<Array<MessageOptions & { key: string }>>([])
let count = 0

const closedCallbacks = new Map<string, () => void>()

function handleRemove(id: string) {
  count--

  // 执行销毁函数
  if (closedCallbacks.has(id)) {
    closedCallbacks.get(id)!()
    closedCallbacks.delete(id)
  }
  if (count === 0 && messageApp) {
    messageApp.unmount()
    document.body.removeChild(messageApp._container)
    messageApp = null
  }
}
function closeMessage(index: number) {
  messages.splice(index, 1)
}

function renderMessageBox() {
  messageApp = createApp({
    render: () =>
      h(UMessageBox, {
        messages,
        onRemove: handleRemove,
        onClose: closeMessage
      })
  })
  const container = document.createElement('ul')
  container.className = cls.e('container')
  document.body.appendChild(container)
  messageApp.mount(container)
}

// @ts-ignore
const msg: Message = options => {
  if (typeof options === 'string') {
    options = {
      message: options
    }
  }

  const { onClosed, ...messageOptions } = options
  const key = String(uid++)
  // 这些回调会在消息离开动画结束后被消费
  onClosed && closedCallbacks.set(key, onClosed)

  messages.push({
    ...messageOptions,
    key
  })

  count++

  if (messageApp?._container) {
    setStyles(messageApp?._container, { zIndex: zIndex() })
  }

  if (messages.length && !messageApp) {
    renderMessageBox()
  }
}

msg.closeAll = function () {
  messages.splice(0).forEach(message => message.onClose?.())
}

messageTypes.forEach(type => {
  msg[type] = (message, config) => {
    msg({
      message,
      type,
      ...config
    })
  }
})

export const message = msg
