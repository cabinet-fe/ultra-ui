export { default as UNotification } from './notification.vue'
import UNotification from './notification.vue'
import { createVNode, render, type VNode, ref, computed } from 'vue'

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

const length = computed(() => notificationQueue.value.length)

let count = 1

const close = (id: string, userClose?: (vm: VNode) => void) => {
  const index = notificationQueue.value.findIndex(({ vm }) => {
    return id === vm.component!.props.id
  })
  if (index > -1) {
    const { vm } = notificationQueue.value[index]!
    userClose?.(vm)
    let offset = Number(notificationQueue.value[index]!.vm.component!.props.offset)
    notificationQueue.value.splice(index, 1)
    let temp = 0
    for (let i = length.value; i > 0; i--) {
      if (i < index + 1) {
        temp = Number(notificationQueue.value[i - 1]!.vm.component!.props.offset)
        notificationQueue.value[i - 1]!.vm.component!.props.offset = offset
        offset = temp
      }
    }
  }
}

const createWrapper = () => {
  if (document.body.querySelector('#notice_id')) {
    return document.body.querySelector('#notice_id')
  } else {
    const wrapper = document.createElement('div')
    wrapper.id = 'notice_id'
    console.log(notificationQueue.value[0]!.vm.el?.offsetHeight)
    Object.assign(wrapper.style, {
      position: 'fixed',
      right: '20px',
      bottom: '20px',
      textAlign: 'center',
    })
    wrapper.addEventListener('mouseenter', (e: MouseEvent) => {
      console.log('enter', e.target)
      if (length.value) {
        let innerCount = 0
        let offset = 0
        let width = 0
        let height = 0
        for (let i = length.value; i > 0; i--) {
          if (i === length.value) {
            width = notificationQueue.value[i - 1]!.vm.el?.offsetWidth
          }
          notificationQueue.value[i - 1]!.vm.component!.props.offset = offset
          offset += notificationQueue.value[i - 1]!.vm.el?.offsetHeight / 2 + 5
          if (innerCount < 3) height += notificationQueue.value[i - 1]!.vm.el?.offsetHeight + 10
          innerCount++
        }

        Object.assign(e.target.style, {
          width: `${width}px`,
          height: `${height}px`,
          overflow: 'hidden'
        })
      }
    })
    wrapper.addEventListener('mouseleave', (e: MouseEvent) => {
      if (e.target.getAttribute('id') !== 'notice_id') return
      if (length.value) {
        let offset = 0
        let innerCount = 0
        let height = 0
        for (let i = length.value; i > 0; i--) {
          if (i === length.value) height = notificationQueue.value[i - 1]!.vm.el?.offsetHeight + 80

          notificationQueue.value[i - 1]!.vm.component!.props.offset = offset
          if (innerCount < 2) offset += 10
          innerCount++
        }
        e.target.style.height = `${height}px`

      } else {
        e.target.style.removeProperty('height')
        e.target.style.removeProperty('overflow')
      }
    })
    document.body.appendChild(wrapper)
    return wrapper
  }
}

export const Notification = (options: NotificationProps) => {
  const container = document.createElement('div')
  const id = `notification_${count++}`

  if (length.value) {
    let offset = options.offset || 0
    let innerCount = 0
    for (let i = length.value; i > 0; i--) {
      if (innerCount < 2) offset += 10
      notificationQueue.value[i - 1]!.vm.component!.props.offset = offset
      innerCount++
    }
  }

  const vm = createVNode(UNotification, {
    ...options,
    offset: options.offset || 0,
    id,
    zIndex: zIndex(),
    onClose: () => {
      close(id, options.onClose)
    }
  })
  vm.props!.onDestroy = () => render(null, container)
  render(vm, container)
  notificationQueue.value.push({ vm })
  // document.body.appendChild(container.firstElementChild!)
  const wrapper = createWrapper()
  wrapper?.appendChild(container.firstElementChild!)
}

