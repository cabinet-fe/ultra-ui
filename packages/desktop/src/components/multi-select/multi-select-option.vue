<template>
  <li
    :class="optionClass"
    @click="handleClick"
    @mousedown="handleMousedown"
    @mouseup="handleMouseup"
    @mouseleave="handleMouseleave"
    :ref="measureElement"
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

const { disabled = false, checked } = defineProps<{
  option: Record<string, any>
  disabled?: boolean
  checked: boolean
  measureElement?: (el: any) => void
}>()

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
