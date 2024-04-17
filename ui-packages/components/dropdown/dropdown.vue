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
import vClickOutside from '@ui/directives/click-outside'

defineOptions({
  name: 'Dropdown',
  inheritAttrs: false
})

const props = withDefaults(defineProps<DropdownProps>(), {
  trigger: 'hover',
  contentTag: 'div'
})

defineEmits<DropdownEmits>()

const cls = bem('dropdown')

const dropdownRef = shallowRef<HTMLElement>()

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
    observeTrigger(dropdownRef.value!, updateDropdown)
    /** 添加滚动事件 */
    scrollParents = getScrollParents(dropdownRef.value!)
    addScrollEvent()
  } else {
    removeScrollEvent()
    window.removeEventListener('resize', close)
    unobserveTrigger(dropdownRef.value!)
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
  if (disabled) return handlers

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
  window.removeEventListener('resize', close)
})

defineExpose<DropdownExposed>({
  open,
  close
})
</script>
