<template>
  <slot v-bind="scope" />
</template>

<script setup lang="ts" generic="R extends any">
import type { ContextProps } from '@ui/types/components/context'

defineOptions({
  name: 'Context'
})

defineProps<ContextProps<R>>()

defineSlots<{
  default(props: R): any
}>()
</script>
