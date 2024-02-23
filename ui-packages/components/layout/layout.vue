<template>
  <div :class="cls.b" :style="style">
    <slot />

    <!-- 竖向调节 -->
    <ULayoutResizer
      v-for="item in verticalResizerList"
      :key="item"
      direction="vertical"
    />

    <!-- 横向调节 -->
    <ULayoutResizer
      v-for="item in horizontalResizerList"
      :key="item"
      direction="horizontal"
    />
  </div>
</template>

<script lang="ts" setup>
import type { LayoutProps } from '@ui/types/components/layout'
import { bem, withUnit } from '@ui/utils'
import { computed, type CSSProperties } from 'vue'
import ULayoutResizer from './layout-resizer.vue'

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

const verticalResizerList = []
const horizontalResizerList = []
</script>
