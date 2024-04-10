export { default as UNotification } from './notification.vue'
import UNotification from './notification.vue'
import { createVNode, render, type VNode, reactive } from 'vue'

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

const notificationQueue = reactive({
  'bottom-right': [] as NotificationItem[],
  'bottom-left': [] as NotificationItem[],
  'top-right': [] as NotificationItem[],
  'top-left': [] as NotificationItem[]
})

const length = (key: string) => {
  return notificationQueue[key].length
}

let count = 1

const close = (id: string, position: string, userClose?: (vm: VNode) => void) => {
  const index = notificationQueue[position].findIndex(({ vm }) => {
    return id === vm.component!.props.id
  })
  if (index > -1) {
    const { vm } = notificationQueue[position][index]!
    userClose?.(vm)
    let offset = Number(notificationQueue[position][index]!.vm.component!.props.offset)
    notificationQueue[position].splice(index, 1)
    let temp = 0
    for (let i = length(position); i > 0; i--) {
      if (i < index + 1) {
        temp = Number(notificationQueue[position][i - 1]!.vm.component!.props.offset)
        notificationQueue[position][i - 1]!.vm.component!.props.offset = offset
        offset = temp
      }
    }
  }
}

const createWrapper = (options: NotificationProps) => {
  const position = options.position || 'bottom-right'
  if (document.getElementById(`notification-${position}-id`)) {
    return document.getElementById(`notification-${position}-id`)
  } else {
    const offset = options.offset || 20
    const wrapper = document.createElement('div')
    wrapper.id = `notification-${position}-id`
    Object.assign(wrapper.style, {
      position: 'fixed',
      textAlign: 'center'
    }, {
      'top-right': { top: `${offset}px`, right: `${offset}px` },
      'top-left': { top: `${offset}px`, left: `${offset}px` },
      'bottom-left': { bottom: `${offset}px`, left: `${offset}px` },
      'bottom-right': { bottom: `${offset}px`, right: `${offset}px` }
    }[position])
    wrapper.addEventListener('mouseenter', (e: MouseEvent) => {
      if (length(position)) {
        let innerCount = 0
        let innerOffset = 0
        let width = 0
        let height = 0
        for (let i = length(position); i > 0; i--) {
          notificationQueue[position][i - 1]!.vm.component!.exposed!.clearTimer()
          if (i === length(position)) {
            width = notificationQueue[position][i - 1]!.vm.el?.offsetWidth + 8
          }
          notificationQueue[position][i - 1]!.vm.component!.props.offset = innerOffset
          innerOffset += notificationQueue[position][i - 1]!.vm.el?.offsetHeight / 2 + 5
          if (innerCount < 3) height += notificationQueue[position][i - 1]!.vm.el?.offsetHeight + 10
          innerCount++
        }

        Object.assign((e.target as HTMLElement).style, {
          width: `${width}px`,
          height: `${height}px`,
          overflow: 'hidden',
          transition: 'height 0.4s'
        })
      }
    })
    wrapper.addEventListener('mouseleave', (e: MouseEvent) => {
      if (length(position)) {
        let innerOffset = 0
        let innerCount = 0
        let height = 0
        for (let i = length(position); i > 0; i--) {
          notificationQueue[position][i - 1]!.vm.component!.exposed!.startTimer()
          if (i === length(position)) height = notificationQueue[position][i - 1]!.vm.el?.offsetHeight + 80
          notificationQueue[position][i - 1]!.vm.component!.props.offset = innerOffset
          if (innerCount < 2) innerOffset += 10
          innerCount++
        }
        ; (e.target as HTMLElement).style.transition = 'height 0.45s'
          ; (e.target as HTMLElement).style.height = `${height}px`
      } else {
        ; (e.target as HTMLElement).style.removeProperty('height')
          ; (e.target as HTMLElement).style.removeProperty('overflow')
      }
    })
    document.body.appendChild(wrapper)
    return wrapper
  }
}

export const Notification = (options: NotificationProps) => {
  const position = options.position || 'bottom-right'
  const container = document.createElement('div')
  const id = `notification_${count++}`

  if (length(position)) {
    let innerOffset = 0
    let innerCount = 0
    for (let i = length(position); i > 0; i--) {
      if (innerCount < 2) innerOffset += 10
      notificationQueue[position][i - 1]!.vm.component!.props.offset = innerOffset
      innerCount++
    }
  }

  const vm = createVNode(UNotification, {
    ...options,
    offset: 0,
    id,
    zIndex: zIndex(),
    onClose: () => {
      close(id, position, options.onClose)
    }
  })
  vm.props!.onDestroy = () => render(null, container)
  render(vm, container)
  notificationQueue[position].push({ vm })
  const wrapper = createWrapper(options)
  wrapper?.appendChild(container.firstElementChild!)
}

