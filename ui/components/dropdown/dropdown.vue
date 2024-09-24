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
        :style="{
          zIndex: zIndex()
        }"
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
import { bem, setStyles, zIndex } from '@ui/utils'
import { shallowRef, computed } from 'vue'
import { vClickOutside } from '@ui/directives'
import { usePop } from '@ui/compositions'

defineOptions({
  name: 'Dropdown',
  inheritAttrs: false
})

const props = withDefaults(defineProps<DropdownProps>(), {
  trigger: 'hover',
  contentTag: 'div',
  clickWhetherHide: false
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
const contentRef = shallowRef<HTMLElement>()
let realTrigger: HTMLElement | undefined

/**显示隐藏 */
const visible = defineModel<boolean>('visible')

let closeTimer: number | undefined

function stopClose() {
  closeTimer !== undefined && clearTimeout(closeTimer)
}

/** 打开下拉框 */
function open(trigger?: { virtual?: HTMLElement; real?: HTMLElement }) {
  stopClose()
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
  if (props.clickWhetherHide) return
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

const { update } = usePop({
  triggerRef,
  contentRef,
  direction: 'bottom',
  onTriggerPositionChange() {
    close()
  },
  onBeforeUpdate(triggerEl, contentEl) {
    setStyles(contentEl, {
      width: props.width ?? `${triggerEl.offsetWidth}px`,
      minWidth: props.minWidth && props.minWidth
    })
  }
})

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

defineExpose<DropdownExposed>({
  open,
  close,
  /**暴露出更新dropdown内容位置方法 适用与级联选择器组件 */
  updateDropdown: update
})
</script>
