<template>
  <li
    :class="optionClass"
    v-ripple:[disabled]="rippleClass"
    @click="!disabled && emit('check', option, !checked)"
  >
    <u-checkbox
      :model-value="checked"
      @update:model-value="emit('check', option, $event)"
      @click.stop
      :disabled="disabled"
    />

    <slot />
  </li>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue'
import { MultiSelectDIKey } from './di'
import { vRipple } from '@ui/directives'
import { UCheckbox } from '../checkbox'

defineOptions({
  name: 'MultiSelectOption'
})

const { option, disabled = false } = defineProps<{
  option: Record<string, any>
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'check', option: Record<string, any>, checked: boolean): void
}>()

const { checkedSet, optionClass, rippleClass } =
  inject(MultiSelectDIKey)!

const checked = computed(() => {
  return checkedSet.has(option)
})
</script>
