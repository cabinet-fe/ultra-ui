<template>
  <li
    :class="optionClass"
    @click="handleClick"
    @mousedown="handleMousedown"
    @mouseup="handleMouseup"
    @mouseleave="handleMouseleave"
    :ref="measureRef"
  >
    <u-checkbox
      :class="checkboxClass"
      :model-value="checked"
      @update:model-value="emit('check', $event)"
      @click.stop
      :disabled="disabled"
    />

    <slot />
  </li>
</template>

<script lang="ts" setup>
import { Ripple } from '@veltra/directives'
import { inject, onBeforeUnmount } from 'vue'

import { UCheckbox } from '../checkbox'
import { MultiSelectDIKey } from './di'

defineOptions({
  name: 'MultiSelectOption'
})

const props = defineProps<{
  option: Record<string, any>
  disabled?: boolean
  checked: boolean
  /**
   * 虚拟项索引：对应 `options` 数组中的绝对位置。
   * 非虚拟模式下可省略；虚拟模式下必须传入，否则元素卸载时 Virtualizer 无法及时解绑，
   * 会因为 ResizeObserver 对脱离 DOM 的元素回调 size=0 而污染尺寸缓存。
   */
  index?: number
  measureElement?: (index: number, el: Element | null) => void
}>()

const { disabled = false, checked } = props

function measureRef(el: unknown) {
  if (typeof props.index !== 'number' || !props.measureElement) return
  props.measureElement(props.index, el as Element | null)
}

const emit = defineEmits<{
  (e: 'check', checked: boolean): void
}>()

const { optionClass, rippleClass, checkboxClass } = inject(MultiSelectDIKey)!

let ripple: Ripple | null = null

function handleClick(e) {
  if (disabled) return
  emit('check', !checked)
}

function handleMousedown(e: MouseEvent) {
  if (disabled) return

  ripple = new Ripple(e.currentTarget as HTMLElement, {
    rippleClass
  })

  ripple.showByEvent(e)
}

function handleMouseleave() {
  ripple?.remove()
}

function handleMouseup() {
  ripple?.remove()
}

onBeforeUnmount(() => {
  ripple?.remove()
  ripple = null
})
</script>
