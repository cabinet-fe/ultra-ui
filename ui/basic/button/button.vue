<template>
  <button :class="cls.b">
    <slot />
  </button>
</template>

<script lang="ts" setup>
import { ButtonProps } from './button.type'
import { bem } from '@ui/helper'

defineOptions({
  name: 'UButton'
})

defineProps<ButtonProps>()

const cls = bem('button')
</script>
