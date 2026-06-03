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
import { withUnit, bem } from '@veltra/utils'
import { computed, inject } from 'vue'

import type { CardCoverProps } from '../../types'
import { CardDIKey } from './di'

defineOptions({ name: 'CardCover' })

const props = defineProps<CardCoverProps>()

const injected = inject(CardDIKey)
const { cls } = injected || {}

if (!injected) {
  console.warn('CardCover组件仅能在Card组件中使用')
}

const style = computed(() => {
  return { height: withUnit(props.height, 'px') }
})
</script>
