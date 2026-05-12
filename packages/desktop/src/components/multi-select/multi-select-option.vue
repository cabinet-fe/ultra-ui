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
import { inject, onBeforeUnmount, shallowRef } from 'vue'

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

function measureRef(el: unknown) {
  if (typeof props.index !== 'number' || !props.measureElement) return
  props.measureElement(props.index, el as Element | null)
}

const emit = defineEmits<{
  (e: 'check', checked: boolean): void
}>()

const { optionClass, rippleClass, checkboxClass } = inject(MultiSelectDIKey)!

const rippleRef = shallowRef<Ripple | null>(null)

function handleClick(e) {
  if (props.disabled) return
  emit('check', !props.checked)
}

function handleMousedown(e: MouseEvent) {
  if (props.disabled) return

  // 清理旧实例，避免同一元素上多个 Ripple 实例同时修改样式
  if (rippleRef.value) {
    rippleRef.value.remove()
    rippleRef.value = null
  }

  rippleRef.value = new Ripple(e.currentTarget as HTMLElement, {
    rippleClass
  })

  rippleRef.value.showByEvent(e)
}

function handleMouseleave() {
  rippleRef.value?.remove()
  rippleRef.value = null
}

function handleMouseup() {
  rippleRef.value?.remove()
  rippleRef.value = null
}

onBeforeUnmount(() => {
  rippleRef.value?.remove()
  rippleRef.value = null
})
</script>
