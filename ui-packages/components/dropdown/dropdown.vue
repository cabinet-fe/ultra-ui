<template>
  <div :class="cls.b" v-bind="{ ...eventsHandlers, ...$attrs }" ref="dropdownRef">
    <slot name="trigger" />
  </div>

  <Teleport to="body">
    <transition name="slide">
      <component
        :is="contentTag"
        v-if="visible"
        :class="[cls.e('content'), contentClass]"
        ref="scrollRef"
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
import type { DropdownProps } from '@ui/types/components/dropdown'
import { bem, computeDropdownPosition } from '@ui/utils'
import { nextTick, shallowRef, shallowReactive, computed, watch } from 'vue'
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

const scrollRef = shallowRef<HTMLElement>()

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

watch(visible, async v => {
  if (v) {
    await nextTick()
    const styles = computeDropdownPosition({
      triggerEl: dropdownRef.value!,
      popupEl: scrollRef.value!
    })
    styles && Object.assign(popupStyle, styles)
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

defineExpose({
  open,
  close
})
</script>
