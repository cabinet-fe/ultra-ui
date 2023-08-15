<template>
  <slot v-bind="{ ctx }" />
</template>

<script setup lang="ts"  generic="R">
import { ContextProps } from './context.type'

defineOptions({
  name: 'UContext'
})

const props = defineProps<ContextProps<R>>()

const ctx = props.scope()

// defineSlots<{
//   default?(props: { ctx: R }): any
// }>()
</script>
