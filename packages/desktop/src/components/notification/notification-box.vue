<template>
  <div
    :class="[cls.e('stack'), cls.em('stack', position)]"
    :style="stackStyle"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <transition-group :name="`notification-${vertical}`" appear @after-leave="handleAfterLeave">
      <div
        v-for="(item, index) of notifications"
        :key="item.key"
        :ref="(el) => observeItem(el, item.key)"
        :data-key="item.key"
        :class="cls.e('item')"
      >
        <UNotification
          v-bind="toCardProps(item)"
          :style="cardStyle(index)"
          @close="handleClose(item.key, item.onClose)"
          @action="handleAction(item.key, item.onClick, item.onClose, $event)"
        />
      </div>
    </transition-group>
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed, onBeforeUnmount, reactive, ref, type CSSProperties } from 'vue'

import type { NotificationOptions, NotificationPosition, NotificationProps } from '../../types'
import UNotification from './notification.vue'

defineOptions({ name: 'UNotificationBox' })

/** 通知项数据结构 */
type NotificationItem = NotificationOptions & { key: string }

const props = defineProps<{ notifications: NotificationItem[]; position: NotificationPosition }>()

const emit = defineEmits<{ (e: 'closed', key: string): void; (e: 'close', key: string): void }>()

const cls = bem('notification')

/** 展开态卡片间距 */
const GAP = 10
/** 折叠态每层露出的高度 */
const PEEK = 14
/** 折叠态最多露出的卡片数 */
const MAX_VISIBLE = 3

const hovering = ref(false)

/** 各卡片实测高度, 驱动展开态位移与容器高度 */
const heights = reactive<Record<string, number>>({})

const vertical = computed(() => (props.position.startsWith('top') ? 'top' : 'bottom'))

/** 底部锚定向上堆叠(负向偏移), 顶部锚定向下堆叠 */
const direction = computed(() => (vertical.value === 'bottom' ? -1 : 1))

const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const el = entry.target as HTMLElement
    const key = el.dataset.key
    if (key) heights[key] = el.offsetHeight
  }
})

function observeItem(el: Element | null, key: string) {
  if (el) observer.observe(el)
}

onBeforeUnmount(() => observer.disconnect())

/** 数组末尾为最新通知, 位于堆叠最前 */
function cardStyle(index: number): CSSProperties {
  const items = props.notifications
  const stackIndex = items.length - 1 - index

  if (hovering.value) {
    // 展开态: 按前方卡片累计高度偏移
    let offset = 0
    for (let i = index + 1; i < items.length; i++) {
      offset += (heights[items[i]!.key] ?? 0) + GAP
    }
    return {
      transform: `translateY(${direction.value * offset}px) scale(1)`,
      opacity: 1,
      pointerEvents: 'auto'
    }
  }

  const clamped = Math.min(stackIndex, MAX_VISIBLE - 1)
  return {
    transform: `translateY(${direction.value * clamped * PEEK}px) scale(${1 - clamped * 0.05})`,
    opacity: stackIndex >= MAX_VISIBLE ? 0 : 1,
    pointerEvents: stackIndex === 0 ? 'auto' : 'none'
  }
}

const stackStyle = computed<CSSProperties>(() => {
  const items = props.notifications
  if (!items.length) return { height: '0px' }

  if (hovering.value) {
    const total = items.reduce((sum, item) => sum + (heights[item.key] ?? 0), 0)
    return { height: `${total + (items.length - 1) * GAP}px` }
  }

  const frontHeight = heights[items[items.length - 1]!.key] ?? 0
  const behind = Math.min(items.length - 1, MAX_VISIBLE - 1)
  return { height: `${frontHeight + behind * PEEK}px` }
})

function toCardProps(item: NotificationItem): NotificationProps {
  return {
    title: item.title,
    message: item.message,
    type: item.type,
    closable: item.closable,
    duration: item.duration,
    icon: item.icon,
    buttonText: item.buttonText,
    size: item.size
  }
}

function handleAfterLeave(el: Element) {
  const key = (el as HTMLElement).dataset.key as string
  observer.unobserve(el as HTMLElement)
  delete heights[key]
  emit('closed', key)
}

function handleClose(key: string, onClose?: () => void) {
  emit('close', key)
  onClose?.()
}

function handleAction(
  key: string,
  onClick: NotificationItem['onClick'],
  onClose: NotificationItem['onClose'],
  e: MouseEvent
) {
  onClick?.(e)
  handleClose(key, onClose)
}
</script>
