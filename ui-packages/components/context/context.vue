<template>
  <slot v-bind="scope" />
</template>

<script setup lang="ts" generic="R extends any">
import { ContextProps } from './context.type'

defineOptions({
  name: 'Context'
})

defineProps<ContextProps<R>>()

defineSlots<{
  default(props: R): any
}>()
</script>
