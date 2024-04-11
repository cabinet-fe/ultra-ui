<template>
  <div
    :class="cls.b"
    v-bind="{ ...eventsHandlers, ...$attrs }"
    ref="dropdownRef"
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
        v-click-outside="close"
      >
        <slot name="content" />
      </component>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import type {
  DropdownProps,
  DropdownExposed
} from '@ui/types/components/dropdown'
import { bem, computeDropdownPosition, getScrollParents } from '@ui/utils'
import {
  nextTick,
  shallowRef,
  shallowReactive,
  computed,
  watch,
  onBeforeUnmount
} from 'vue'
import vClickOutside from '@ui/directives/click-outside'

defineOptions({
  name: 'Dropdown',
  inheritAttrs: false
})

const props = withDefaults(defineProps<DropdownProps>(), {
  trigger: 'hover',
  contentTag: 'div'
})

const cls = bem('dropdown')

const dropdownRef = shallowRef<HTMLElement>()

const contentRef = shallowRef<HTMLElement>()

/**显示隐藏 */
const visible = shallowRef(false)

const popupStyle = shallowReactive({
  top: '',
  left: '',
  width: '',
  transformOrigin: ''
})

const popupFinalStyle = computed(() => {
  const { width, ...rest } = popupStyle
  return {
    width: props.width || width,
    minWidth: props.minWidth,
    ...rest
  }
})

let closeTimer: number | undefined

/**鼠标移入元素 */
function open() {
  closeTimer !== undefined && clearTimeout(closeTimer)
  if (props.trigger === 'hover') {
    visible.value = true
  } else if (props.trigger === 'click') {
    visible.value = !visible.value
  }
}

function close() {
  if (props.trigger === 'hover') {
    closeTimer = setTimeout(() => {
      visible.value = false
    }, 200)
  } else if (props.trigger === 'click') {
    visible.value = false
  }
}

function updateDropdown() {
  if (!dropdownRef.value || !contentRef.value) return

  const styles = computeDropdownPosition({
    triggerEl: dropdownRef.value,
    popupEl: contentRef.value
  })
  styles && Object.assign(popupStyle, styles)
}

let scrollParents: HTMLElement[] = []

function addScrollEvent() {
  scrollParents.forEach(el => {
    el.addEventListener('scroll', updateDropdown)
  })
}

function removeScrollEvent() {
  scrollParents.forEach(el => {
    el.removeEventListener('scroll', updateDropdown)
  })

  scrollParents = []
}

watch(visible, async v => {
  if (v) {
    await nextTick()
    updateDropdown()

    /** 添加滚动事件 */
    scrollParents = getScrollParents(dropdownRef.value!)
    addScrollEvent()
  } else {
    removeScrollEvent()
  }
})

const eventsHandlers = computed(() => {
  const { trigger } = props

  const handlers: Record<string, Function> = {}

  if (trigger === 'click') {
    handlers.onClick = open
  } else if (trigger === 'hover') {
    handlers.onMouseenter = open
    handlers.onMouseleave = close
  }

  return handlers
})

onBeforeUnmount(() => {
  removeScrollEvent()
})

defineExpose<DropdownExposed>({
  open,
  close
})
</script>
