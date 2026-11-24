import { bem, setStyles, zIndex } from '@veltra/utils'
import { h, render, shallowReactive } from 'vue'

import type { MessageOptions, Message, MessageInstance } from '../../types'
import UMessageBox from './message-box.vue'

const cls = bem('message')

type MessageItem = MessageOptions & { key: string }

let container: HTMLElement | null = null
const messages = shallowReactive<MessageItem[]>([])

const closedCallbacks = new Map<string, () => void>()

/** 用于计数正在显示的 DOM 节点 (包含动画执行中) */
let activeCount = 0
let uid = 0

const destroy = () => {
  if (container) {
    render(null, container)
    document.body.removeChild(container)
    container = null
  }
}

const handleClosed = (id: string) => {
  activeCount--

  const cb = closedCallbacks.get(id)
  if (cb) {
    cb()
    closedCallbacks.delete(id)
  }

  // 没有活跃消息时销毁容器，保持页面干净
  if (activeCount === 0) destroy()
}

/** 触发关闭 (仅从数组移除，触发 Transition 离开动画) */
const handleClose = (id: string) => {
  const index = messages.findIndex((m) => m.key === id)
  if (index !== -1) messages.splice(index, 1)
}

const ensureContainer = () => {
  if (container) return container

  container = document.createElement('ul')
  container.className = cls.e('container')
  document.body.appendChild(container)
  return container
}

const updateView = () => {
  const el = ensureContainer()
  setStyles(el, { zIndex: zIndex() })

  const vnode = h(UMessageBox, {
    messages,
    onClosed: handleClosed,
    onClose: (i: number) => messages.splice(i, 1)
  })

  vnode.appContext = message._context
  render(vnode, el)
}

const createMessage = (options: MessageOptions): MessageInstance => {
  const { onClosed: userOnClosed, ...messageOptions } = options
  const id = `msg_${uid++}`
  activeCount++

  let resolveClosed: () => void
  const onClosed = new Promise<void>((r) => (resolveClosed = r))

  closedCallbacks.set(id, () => {
    userOnClosed?.()
    resolveClosed()
  })

  messages.push({ key: id, ...messageOptions })
  updateView()

  return { id, close: () => handleClose(id), onClosed }
}

export const message = ((options) => {
  const mergedOptions = typeof options === 'string' ? { message: options } : options
  return createMessage(mergedOptions)
}) as Message

message._context = null

const messageTypes = ['success', 'warn', 'info', 'error', 'default'] as const
messageTypes.forEach((type) => {
  message[type] = (msg, config) => message({ ...config, message: msg, type })
})

message.closeAll = () => {
  messages.splice(0)
}
