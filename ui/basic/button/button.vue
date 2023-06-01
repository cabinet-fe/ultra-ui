<template>
  <button type="button" :class="cls.b">
    <slot />
  </button>
</template>

<script lang="ts" setup>
import { bem } from '@ui/helper'
import { ButtonProps } from './button.type'

const cls = bem('button')

defineOptions({
  name: 'UButton'
})

defineProps<ButtonProps>()
</script>
