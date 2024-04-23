<template>
  <div :class="cls?.e('cover')" :style="style">
    <img
      v-if="src"
      :src="src"
      draggable="false"
      alt="封面"
      :class="bem.is('height-fixed', props.height !== undefined)"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue'
import { CardDIKey } from './di'
import type { CardCoverProps } from '@ui/types/components/card'
import { withUnit, bem } from '@ui/utils'

defineOptions({ name: 'CardCover' })

const props = defineProps<CardCoverProps>()

const injected = inject(CardDIKey)
const { cls } = injected || {}

if (!injected) {
  console.warn('CardCover组件仅能在Card组件中使用')
}

const style = computed(() => {
  return {
    height: withUnit(props.height, 'px')
  }
})
</script>
