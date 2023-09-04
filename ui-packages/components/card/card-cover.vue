<template>
  <div :class="cls?.e('cover')">
    <img v-if="src" :src="src" alt="封面" />
  </div>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { CardDIKey } from './di'
import type { CardCoverProps } from './card.type'

defineOptions({ name: 'CardCover' })

defineProps<CardCoverProps>()

const injected = inject(CardDIKey)
const { cls } = injected || {}

if (!injected) {
  console.warn('CardCover组件仅能在Card组件中使用')
}
</script>
