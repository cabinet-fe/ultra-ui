<template>
  <i :class="cls.b" :style="style">
    <slot></slot>
  </i>
</template>

<script lang="ts" setup>
import { bem, withUnit } from '@veltra/utils'
import { type CSSProperties, computed } from 'vue'

import type { IconProps } from '../../types'

defineOptions({ name: 'UIcon' })

const props = defineProps<IconProps>()

const cls = bem('icon')

const style = computed<CSSProperties>(() => {
  return { fontSize: withUnit(props.size, 'px') }
})
</script>
