<template>
  <div :class="cls?.e('action')" :style="style">
    <slot> </slot>
  </div>
</template>

<script lang="ts" setup>
import { type CSSProperties, computed, inject } from 'vue'
import { CardDIKey } from './di'
import type { CardActionProps } from './card.type'

defineOptions({ name: 'CardAction' })

const props = defineProps<CardActionProps>()

const style = computed<CSSProperties>(() => {
  return {
    textAlign: props.alignRight ? 'right' : undefined
  }
})

const injected = inject(CardDIKey)
const { cls } = injected || {}

if (!injected) {
  console.warn('CardAction组件仅能在Card组件中使用')
}
</script>
