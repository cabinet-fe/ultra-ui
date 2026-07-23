import { bem, zIndex } from '@veltra/utils'
import { h, render, shallowReactive } from 'vue'

import type {
  MessageConfirm,
  MessageConfirmAction,
  MessageConfirmInstance,
  MessageConfirmOptions
} from '../../types'
import UMessageConfirmBox from './message-confirm-box.vue'

const cls = bem('message-confirm')

/** 确认框项数据结构 */
type ConfirmItem = MessageConfirmOptions & { key: string }

/** --- 状态管理 --- */
let container: HTMLElement | null = null
const confirms = shallowReactive<ConfirmItem[]>([])

/** 关闭动画结束后的回调 */
const closedCallbacks = new Map<string, (action: MessageConfirmAction) => void>()

/** 记录每项关闭时的用户操作，动画结束后随回调抛出 */
const pendingActions = new Map<string, MessageConfirmAction>()

/** 用于计数正在显示的 DOM 节点 (包含动画执行中) */
let activeCount = 0
let uid = 0

/** --- 内部辅助函数 --- */

/** 彻底销毁容器 */
const destroy = () => {
  if (container) {
    render(null, container)
    document.body.removeChild(container)
    container = null
  }
}

/** 离开动画结束后的清理 */
const handleClosed = (key: string) => {
  activeCount--

  const cb = closedCallbacks.get(key)
  if (cb) {
    cb(pendingActions.get(key) ?? 'cancel')
    closedCallbacks.delete(key)
  }
  pendingActions.delete(key)

  // 没有活跃确认框时销毁容器，保持页面干净
  if (activeCount === 0) destroy()
}

/** 触发关闭 (仅从数组移除，触发 Transition 离开动画) */
const handleClose = (key: string, action: MessageConfirmAction) => {
  pendingActions.set(key, action)
  const index = confirms.findIndex((c) => c.key === key)
  if (index !== -1) confirms.splice(index, 1)
}

/** 挂载并渲染容器 */
const ensureContainer = () => {
  if (container) return container

  container = document.createElement('div')
  container.className = cls.e('container')
  document.body.appendChild(container)
  return container
}

/** 执行 Vue 渲染逻辑 */
const updateView = () => {
  const el = ensureContainer()

  const vnode = h(UMessageConfirmBox, { confirms, onClosed: handleClosed, onClose: handleClose })

  vnode.appContext = messageConfirm._context
  render(vnode, el)
}

/** 创建确认框实例 */
const createConfirm = (options: MessageConfirmOptions): MessageConfirmInstance => {
  const { onClosed: userOnClosed, ...confirmOptions } = options
  const id = `confirm_${uid++}`
  activeCount++

  // 生命周期 Promise
  let resolveClosed: (action: MessageConfirmAction) => void
  const onClosed = new Promise<MessageConfirmAction>((r) => (resolveClosed = r))

  closedCallbacks.set(id, (action) => {
    userOnClosed?.(action)
    resolveClosed(action)
  })

  confirms.push({ zIndex: zIndex(), ...confirmOptions, key: id })
  updateView()

  return { id, close: (action = 'cancel') => handleClose(id, action), onClosed }
}

/** --- 导出 API --- */

export const messageConfirm = ((options) => {
  return createConfirm(typeof options === 'string' ? { message: options } : options)
}) as MessageConfirm

messageConfirm._context = null

// 挂载快捷方法: messageConfirm.danger(...)
const confirmTypes = ['primary', 'success', 'info', 'warning', 'danger'] as const
confirmTypes.forEach((type) => {
  messageConfirm[type] = (msg, config) =>
    messageConfirm({ ...config, message: msg, confirmButtonType: type })
})

/** 关闭所有当前显示的确认框 */
messageConfirm.closeAll = () => {
  confirms.splice(0)
}
