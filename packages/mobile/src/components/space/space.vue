<template>
  <div :class="classList" :style="style">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { bem } from '@veltra/utils'
import { computed } from 'vue'

import type { SpaceProps } from '../../types/space'

defineOptions({ name: 'USpace' })

const {
  size = 'default',
  direction = 'horizontal',
  align = 'center',
  wrap = false
} = defineProps<SpaceProps>()

const cls = bem('space')

const classList = computed(() => [
  cls.b,
  cls.m(direction),
  typeof size === 'string' && cls.m(size),
  cls.m('align-' + align),
  bem.is('wrap', wrap)
])

/** 间距档走 token class；数字与二元组写内联 gap */
const style = computed(() => {
  if (typeof size === 'number') {
    return { gap: `${size}px` }
  }

  if (Array.isArray(size)) {
    const [horizontal, vertical] = size
    return { columnGap: `${horizontal}px`, rowGap: `${vertical}px` }
  }

  return undefined
})
</script>
