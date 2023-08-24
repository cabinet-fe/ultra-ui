<template>
  <div :class="cls?.e('footer')">
    <slot> </slot>
  </div>
</template>

<script lang="ts" setup>
import { inject } from 'vue'
import { CardDIKey } from './di'

defineOptions({ name: 'CardFooter' })

const injected = inject(CardDIKey)
const { cls } = injected || {}

if (!injected) {
  console.warn('CardFooter组件仅能在Card组件中使用')
}
</script>
