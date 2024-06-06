<template>
  <div
    v-if="slots.trigger"
    :class="cls.b"
    v-bind="{ ...eventsHandlers, ...$attrs }"
    ref="triggerRef"
  >
    <slot name="trigger" />
  </div>

  <Teleport to="body">
    <transition name="slide">
      <component
        :is="contentTag"
        v-if="visible"
        :class="[cls.e('content'), contentClass]"
        ref="contentRef"
        :style="popupFinalStyle"
        @mouseenter="eventsHandlers.onMouseenter"
        @mouseleave="eventsHandlers.onMouseleave"
        v-click-outside="trigger === 'click' ? handleClickOutside : undefined"
      >
        <slot name="content" />
      </component>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import type {
  DropdownProps,
  DropdownExposed,
  DropdownEmits
} from '@ui/types/components/dropdown'
import {
  bem,
  computeDropdownPosition,
  getScrollParents,
  zIndex,
  observeTrigger,
  unobserveTrigger
} from '@ui/utils'
import {
  nextTick,
  shallowRef,
  shallowReactive,
  computed,
  watch,
  onBeforeUnmount
} from 'vue'
import { vClickOutside } from '@ui/directives'

defineOptions({
  name: 'Dropdown',
  inheritAttrs: false
})

const props = withDefaults(defineProps<DropdownProps>(), {
  trigger: 'hover',
  contentTag: 'div'
})

defineEmits<DropdownEmits>()

const slots = defineSlots<{
  /** 内容 */
  content?: () => any
  /** 触发器 */
  trigger?: () => any
}>()

const cls = bem('dropdown')

const triggerRef = shallowRef<HTMLElement>()
let realTrigger: HTMLElement | undefined

const contentRef = shallowRef<HTMLElement>()

/**显示隐藏 */
const visible = defineModel<boolean>('visible')

const popupStyle = shallowReactive({
  top: '',
  left: '',
  width: '',
  transformOrigin: '',
  zIndex: zIndex()
})

watch(visible, async v => {
  if (v) {
    await nextTick()
    popupStyle.zIndex = zIndex()
    window.addEventListener('resize', close)
    observeTrigger(triggerRef.value!, updateDropdown)
    /** 添加滚动事件 */
    scrollParents = getScrollParents(triggerRef.value!)
    addScrollEvent()
  } else {
    removeScrollEvent()
    window.removeEventListener('resize', close)
    unobserveTrigger(triggerRef.value!)
  }
})

const popupFinalStyle = computed(() => {
  const ret: Record<string, string | number> = {
    ...popupStyle
  }
  if (props.minWidth) {
    ret.minWidth = props.minWidth
  }
  if (props.width) {
    ret.width = props.width
  }
  return ret
})

let closeTimer: number | undefined

/** 打开下拉框 */
function open(trigger?: { virtual?: HTMLElement; real?: HTMLElement }) {
  closeTimer !== undefined && clearTimeout(closeTimer)
  const { virtual, real } = trigger || {}
  if (virtual && virtual instanceof HTMLElement) {
    triggerRef.value = virtual

    realTrigger = real || virtual
  }

  visible.value = true
}

function close() {
  realTrigger = undefined
  if (props.trigger === 'hover') {
    closeTimer = setTimeout(() => {
      visible.value = false
    }, 200)
  } else {
    visible.value = false
  }
}

/** 点击外部 */
function handleClickOutside(e: MouseEvent) {
  // 点击触发且点击元素属于触发元素内（包含触发元素本身）时不关闭
  if (
    props.trigger === 'click' &&
    (triggerRef.value?.contains(e.target as Node) ||
      realTrigger?.contains(e.target as Node))
  ) {
    return
  }

  close()
}

function updateDropdown() {
  if (!triggerRef.value || !contentRef.value) return
  const styles = computeDropdownPosition({
    triggerEl: triggerRef.value,
    popupEl: contentRef.value
  })
  styles && Object.assign(popupStyle, styles)
}

let scrollParents: HTMLElement[] = []

function addScrollEvent() {
  scrollParents.forEach(el => {
    el.addEventListener('scroll', close)
  })
}

function removeScrollEvent() {
  scrollParents.forEach(el => {
    el.removeEventListener('scroll', close)
  })

  scrollParents = []
}

const eventsHandlers = computed(() => {
  const { trigger, disabled } = props

  const handlers: Record<string, Function> = {}
  if (disabled || trigger === 'custom') return handlers

  if (trigger === 'click') {
    handlers.onClick = visible.value ? close : open
  } else if (trigger === 'hover') {
    handlers.onMouseenter = open
    handlers.onMouseleave = close
  }

  return handlers
})

onBeforeUnmount(() => {
  removeScrollEvent()
  window.removeEventListener('resize', close)
})

defineExpose<DropdownExposed>({
  open,
  close
})
</script>
