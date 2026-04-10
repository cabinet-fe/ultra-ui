<template>
  <div :class="cls.e('color-switch')">
    <div :class="cls.e('color-type')">HEX(A)</div>

    <u-input
      :class="cls.e('color-hexa')"
      :clearable="false"
      :model-value="color"
      @change="handleUpdateColor"
      :pattern="pattern"
    />

    <u-button text type="primary" :class="cls.e('clear-btn')" @click="emit('clear')">
      清除
    </u-button>
  </div>
</template>

<script lang="ts" setup>
import { inject } from 'vue'

import { UButton } from '../button'
import { UInput } from '../input'
import { PaletteDIKey } from './di'

defineProps<{
  color?: string
}>()

const emit = defineEmits(['clear', 'update:color'])

const { cls } = inject(PaletteDIKey)!

const pattern = /^#([0-9a-fA-F]{3,4}){1,2}$/

const handleUpdateColor = (value: string) => {
  emit('update:color', value)
}
</script>
