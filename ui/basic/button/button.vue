<template>
  <button type="button" :class="button">
    <slot />
  </button>
</template>

<script lang="ts" setup>
import { ButtonProps } from './button.type'
import { button } from './style.css'

defineOptions({
  name: 'UButton'
})

defineProps<ButtonProps>()
</script>
