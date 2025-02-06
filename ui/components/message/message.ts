import { createApp, h, shallowReactive, type App } from 'vue'
import type { MessageOptions, Message } from '@ui/types'
import { bem, setStyles, zIndex } from '@ui/utils'
import UMessageBox from './message-box.vue'

const cls = bem('message')

let messageApp: App | null = null

const messages = shallowReactive<Array<MessageOptions & { key: string }>>([])

/** 消息关闭回调Map，key是消息的uid */
const closedCallbacks = new Map<string, () => void>()
/**
 * 消息dom的渲染计数。
 * @description 这个计数在创建消息时+1，在消息离开动画结束后减一
 */
let count = 0
/** 用于确定消息实例的全局唯一id */
let uid = 0

/** 在关闭后离开动画也结束后的回调 */
function onClosed(uid: string) {
  count--

  const cb = closedCallbacks.get(uid)
  if (cb) {
    cb()
    closedCallbacks.delete(uid)
  }

  if (count === 0 && messageApp) {
    messageApp.unmount()
    document.body.removeChild(messageApp._container)
    messageApp = null
  }
}

/** 在关闭但离开动画还未结束时的回调 */
function onClose(index: number) {
  messages.splice(index, 1)
}

function createMessage(options: MessageOptions) {
  const { onClosed, ...messageOptions } = options

  count++
  const key = String(uid++)

  // 收集关闭后回调
  onClosed && closedCallbacks.set(key, onClosed)

  messages.push({ key, ...messageOptions })

  if (messageApp?._container) {
    setStyles(messageApp?._container, { zIndex: zIndex() })
  }

  return key
}

/** 渲染消息盒子 */
function renderMessageBox() {
  if (!messages.length || messageApp) return

  messageApp = createApp({
    render: () => h(UMessageBox, { messages, onClosed, onClose })
  })

  const container = document.createElement('ul')
  container.className = cls.e('container')
  setStyles(container, { zIndex: zIndex() })
  document.body.appendChild(container)

  messageApp.mount(container)
}

// @ts-ignore
export const message: Message = function (options) {
  if (typeof options === 'string') {
    options = {
      message: options
    }
  }
  createMessage(options)
  renderMessageBox()
}

const messageTypes = ['success', 'warn', 'info', 'error', 'default'] as const
messageTypes.forEach(type => {
  message[type] = function (msg, config) {
    return message({ message: msg, type, ...config })
  }
})

message.closeAll = function () {
  messages.splice(0).forEach(message => message.onClose?.())
}
