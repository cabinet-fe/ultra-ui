<template>
  <i :class="cls.b" :style="style">
    <slot></slot>
  </i>
</template>

<script lang="ts" setup>
import { bem } from '@ultra-ui/utils'
import type { IconProps } from '@ultra-ui/desktop/types'
import { type CSSProperties, computed } from 'vue'
import { withUnit } from '@ultra-ui/utils'

defineOptions({
  name: 'Icon'
})

const props = defineProps<IconProps>()

const cls = bem('icon')

const style = computed<CSSProperties>(() => {
  return {
    fontSize: withUnit(props.size, 'px')
  }
})
</script>
