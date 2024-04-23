<template>
  <li
    :class="optionClass"
    v-ripple="disabled ? false : rippleClass"
    @click="!disabled && emit('check', !checked)"
  >
    <u-checkbox
      :model-value="checked"
      @update:model-value="emit('check', $event)"
      @click.stop
      :disabled="disabled"
    />

    <slot />
  </li>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { MultiSelectDIKey } from './di'
import { vRipple } from '@ui/directives'
import { UCheckbox } from '../checkbox'

defineOptions({
  name: 'MultiSelectOption'
})

const { disabled = false } = defineProps<{
  option: Record<string, any>
  disabled?: boolean
  checked: boolean
}>()

const emit = defineEmits<{
  (e: 'check', checked: boolean): void
}>()

const { optionClass, rippleClass } = inject(MultiSelectDIKey)!
</script>
