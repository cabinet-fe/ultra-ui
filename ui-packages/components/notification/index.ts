export { default as UNotification } from './notification.vue'
import UNotification from './notification.vue'
import { createVNode, render, type VNode, ref } from 'vue'

export type {
  NotificationProps,
  NotificationEmits,
  NotificationExposed
} from '@ui/types/components/notification'

import type { NotificationProps } from '@ui/types/components/notification'
import { zIndex } from '@ui/utils'

type NotificationItem = {
  vm: VNode
}

const notificationQueue = ref<NotificationItem[]>([])

let count = 1

const close = (id: string, userClose?: (vm: VNode) => void) => {
  const index = notificationQueue.value.findIndex(({ vm }) => {
    return id === vm.component!.props.id
  })
  if (index > -1) {
    const { vm } = notificationQueue.value[index]!
    userClose?.(vm)
    const removedHeight = vm.el!.offsetHeight
    notificationQueue.value.splice(index, 1)
    notificationQueue.value.forEach((notification, i) => {
      if (i >= index) {
        notification.vm.component!.props.offset = parseInt(notification.vm.el!.style['top'], 10) - removedHeight - 16
      }
    })
  }
}

export const Notification = (options: NotificationProps) => {
  const container = document.createElement('div')
  const id = `notification_${count++}`

  let len = notificationQueue.value.length
  if (len) {
    let offset = options.offset || 20
    let innerCount = 0
    for (let i = len; i > 0; i--) {
      if (innerCount < 2) offset += 10
      notificationQueue.value[i-1]!.vm.component!.props.offset = offset
      innerCount ++
      // notificationQueue.value[i-1]!.vm.component!.props.width = notificationQueue.value[i-1]!.vm.el?.offsetWidth * 0.8
    }
  }

  // notificationQueue.value.forEach(({ vm }, index) => {
  // offset += (vm.el?.offsetHeight || 0) + 16
  // })
  // notification.vm.component!.props.offset
  // offset += 16
  const vm = createVNode(UNotification, {
    ...options,
    offset: options.offset || 20,
    id,
    zIndex: zIndex(),
    onClose: () => {
      close(id, options.onClose)
    }
  })
  vm.props!.onDestroy = () => render(null, container)
  render(vm, container)
  notificationQueue.value.push({ vm })
  document.body.appendChild(container.firstElementChild!)
}

