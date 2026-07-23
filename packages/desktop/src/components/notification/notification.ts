import { bem, setStyles, zIndex } from '@veltra/utils'
import { h, render, shallowReactive } from 'vue'

import type {
  Notification,
  NotificationInstance,
  NotificationOptions,
  NotificationPosition
} from '../../types'
import UNotificationBox from './notification-box.vue'

const cls = bem('notification')

/** 通知项数据结构 */
type NotificationItem = NotificationOptions & { key: string }

/** 单个方位的堆叠状态 */
interface NotificationStack {
  container: HTMLElement | null
  items: NotificationItem[]
  /** 正在显示的通知数 (包含动画执行中) */
  activeCount: number
}

/** --- 状态管理 --- */
const stacks: Record<NotificationPosition, NotificationStack> = {
  'top-left': { container: null, items: shallowReactive([]), activeCount: 0 },
  'top-right': { container: null, items: shallowReactive([]), activeCount: 0 },
  'bottom-left': { container: null, items: shallowReactive([]), activeCount: 0 },
  'bottom-right': { container: null, items: shallowReactive([]), activeCount: 0 }
}

/** 通知关闭后回调 */
const closedCallbacks = new Map<string, () => void>()

let uid = 0

/** --- 内部辅助函数 --- */

/** 彻底销毁容器 */
const destroy = (stack: NotificationStack) => {
  if (stack.container) {
    render(null, stack.container)
    document.body.removeChild(stack.container)
    stack.container = null
  }
}

/** 离开动画结束后的清理 */
const handleClosed = (stack: NotificationStack, key: string) => {
  stack.activeCount--

  const cb = closedCallbacks.get(key)
  if (cb) {
    cb()
    closedCallbacks.delete(key)
  }

  // 没有活跃通知时销毁容器，保持页面干净
  if (stack.activeCount === 0) destroy(stack)
}

/** 触发关闭 (仅从数组移除，触发 Transition 离开动画) */
const handleClose = (stack: NotificationStack, key: string) => {
  const index = stack.items.findIndex((n) => n.key === key)
  if (index !== -1) stack.items.splice(index, 1)
}

/** 挂载并渲染容器 */
const updateView = (position: NotificationPosition, options: NotificationOptions) => {
  const stack = stacks[position]

  if (!stack.container) {
    stack.container = document.createElement('div')
    stack.container.className = cls.e('container')
    document.body.appendChild(stack.container)
  }

  const offset = options.offset ?? 20
  const [vertical, horizontal] = position.split('-') as ['top' | 'bottom', 'left' | 'right']
  setStyles(stack.container, {
    position: 'fixed',
    zIndex: options.zIndex ?? zIndex(),
    [vertical]: `${offset}px`,
    [horizontal]: `${offset}px`
  })

  const vnode = h(UNotificationBox, {
    notifications: stack.items,
    position,
    onClosed: (key: string) => handleClosed(stack, key),
    onClose: (key: string) => handleClose(stack, key)
  })

  vnode.appContext = notification._context
  render(vnode, stack.container)
}

/** 创建通知实例 */
const createNotification = (options: NotificationOptions): NotificationInstance => {
  const { onClosed: userOnClosed, position = 'bottom-right', ...notificationOptions } = options
  const stack = stacks[position]
  const id = `notification_${uid++}`
  stack.activeCount++

  // 生命周期 Promise
  let resolveClosed: () => void
  const onClosed = new Promise<void>((r) => (resolveClosed = r))

  closedCallbacks.set(id, () => {
    userOnClosed?.()
    resolveClosed()
  })

  stack.items.push({ ...notificationOptions, position, key: id })
  updateView(position, options)

  return { id, close: () => handleClose(stack, id), onClosed }
}

/** --- 导出 API --- */

export const notification = ((options) => {
  return createNotification(typeof options === 'string' ? { message: options } : options)
}) as Notification

notification._context = null

// 挂载快捷方法: notification.success(...)
const notificationTypes = ['primary', 'success', 'info', 'warning', 'danger'] as const
notificationTypes.forEach((type) => {
  notification[type] = (msg, config) => notification({ ...config, message: msg, type })
})

/** 关闭所有通知，可指定方位 */
notification.closeAll = (position?: NotificationPosition) => {
  if (position) {
    stacks[position].items.splice(0)
    return
  }
  ;(Object.keys(stacks) as NotificationPosition[]).forEach((p) => stacks[p].items.splice(0))
}
