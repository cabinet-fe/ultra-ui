<template>
  <div :class="classList">
    <slot> </slot>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue'
import { CardDIKey } from './di'

defineOptions({ name: 'CardHeader' })

const injected = inject(CardDIKey)
const { cls } = injected || {}

const classList = computed(() => {
  const ret: string[] = []
  if (cls) {
    ret.push(cls.e('header'))
  }

  return ret
})

if (!injected) {
  console.warn('CardHeader组件仅能在Card组件中使用')
}
</script>
