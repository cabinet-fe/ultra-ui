<template>
  <div :class="cls?.e('header')">
    <slot> </slot>
  </div>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { CardDIKey } from './di'

defineOptions({ name: 'CardHeader' })

const injected = inject(CardDIKey)
const { cls } = injected || {}

if (!injected) {
  console.warn('CardHeader组件仅能在Card组件中使用')
}
</script>
