<template>
  <div :class="cls?.e('content')" :style="style">
    <slot> </slot>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, type CSSProperties } from 'vue'
import { CardDIKey } from './di'
import type { CardContentProps } from './card.type'

defineOptions({ name: 'CardContent' })

const props = defineProps<CardContentProps>()

const style = computed<CSSProperties | undefined>(() => {
  return props.cover ? {
    padding: 0,
    fontSize: 0
  } : undefined
})

const injected = inject(CardDIKey)
const { cls } = injected || {}

if (!injected) {
  console.warn('CardContent组件仅能在Card组件中使用')
}
</script>
