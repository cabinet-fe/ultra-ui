<template>
  <div :class="cls?.e('body')">
    <slot> </slot>
  </div>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { CardDIKey } from './di'

defineOptions({ name: 'CardBody' })

const injected = inject(CardDIKey)
const { cls } = injected || {}

if (!injected) {
  console.warn('CardBody组件仅能在Card组件中使用')
}
</script>
