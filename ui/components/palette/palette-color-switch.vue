<template>
  <div :class="cls.e('color-switch')">
    <div :class="cls.e('color-type')">HEX(A)</div>

    <span :class="cls.e('color-hexa')">
      {{ color || '-' }}
    </span>

    <u-button
      text
      type="primary"
      :class="cls.e('clear-btn')"
      @click="emit('clear')"
    >
      清除
    </u-button>
  </div>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { PaletteDIKey } from './di'
import { UButton } from '../button'

defineProps<{
  color?: string
}>()

const emit = defineEmits(['clear'])

const { cls } = inject(PaletteDIKey)!
</script>
