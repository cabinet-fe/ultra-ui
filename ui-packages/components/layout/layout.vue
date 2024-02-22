<template>
  <div :class="cls.b" :style="style">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import type { LayoutProps } from '@ui/types/components/layout'
import { bem, withUnit } from '@ui/utils'
import { computed, type CSSProperties } from 'vue'

defineOptions({
  name: 'Layout'
})

const props = defineProps<LayoutProps>()

const cls = bem('layout')

const style = computed<CSSProperties>(() => {
  const { cols, rows, gap } = props
  return {
    gridTemplateColumns: cols
      ? typeof cols === 'string'
        ? cols
        : cols.join(' ')
      : '',
    gridTemplateRows: rows
      ? typeof rows === 'string'
        ? rows
        : rows.join(' ')
      : '',
    columnGap: withUnit(gap, 'px')
  }
})
</script>
